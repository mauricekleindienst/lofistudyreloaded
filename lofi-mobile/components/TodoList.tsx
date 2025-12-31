import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Plus, Check, Trash2, Target, Heart, BookOpen, Zap, ListTodo, X } from 'lucide-react-native';
import { theme } from '../theme';
import { db, Todo } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import Auth from './Auth';

// --- Types & Constants ---

type Priority = 'low' | 'medium' | 'high';
type Category = 'work' | 'personal' | 'study' | 'health';
type FilterType = 'all' | 'active' | 'completed';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const CATEGORIES: Category[] = ['work', 'personal', 'study', 'health'];
const FILTERS: FilterType[] = ['all', 'active', 'completed'];

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'work': return <Target size={14} color="#3b82f6" />;
    case 'personal': return <Heart size={14} color="#ec4899" />;
    case 'study': return <BookOpen size={14} color="#8b5cf6" />;
    case 'health': return <Zap size={14} color="#22c55e" />;
    default: return <ListTodo size={14} color={theme.colors.textSecondary} />;
  }
};

// --- Sub-Components ---

const TodoItem = memo(({ item, onToggle, onDelete }: { item: Todo; onToggle: (id: number) => void; onDelete: (id: number) => void }) => {
  const priorityColor = PRIORITY_COLORS[item.priority as Priority] || theme.colors.textSecondary;
  
  return (
    <BlurView intensity={20} tint="dark" style={styles.todoItem}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkedBox]}
        onPress={() => item.id && onToggle(item.id)}
      >
        {item.completed && <Check size={14} color="#fff" />}
      </TouchableOpacity>
      
      <View style={styles.todoContent}>
        <Text style={[styles.todoText, item.completed && styles.completedText]}>
          {item.text}
        </Text>
        <View style={styles.todoMeta}>
          <View style={styles.badge}>
            {getCategoryIcon(item.category || 'work')}
            <Text style={styles.badgeText}>{item.category || 'work'}</Text>
          </View>
          <View style={[styles.badge, { borderColor: priorityColor }]}>
            <Text style={[styles.badgeText, { color: priorityColor }]}>
              {item.priority || 'medium'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => item.id && onDelete(item.id)} style={styles.deleteButton}>
        <Trash2 size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </BlurView>
  );
});

const ProgressBar = memo(({ completed, total }: { completed: number; total: number }) => {
  if (total === 0) return null;
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(completed / total) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{completed} of {total} completed</Text>
    </View>
  );
});

const FilterTabs = memo(({ currentFilter, onChange }: { currentFilter: FilterType; onChange: (f: FilterType) => void }) => (
  <View style={styles.filterContainer}>
    {FILTERS.map((f) => (
      <TouchableOpacity
        key={f}
        style={[styles.filterTab, currentFilter === f && styles.activeFilterTab]}
        onPress={() => onChange(f)}
      >
        <Text style={[styles.filterText, currentFilter === f && styles.activeFilterText]}>
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
));

// --- Main Component ---

export default function TodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Task State
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newCategory, setNewCategory] = useState<Category>('work');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) loadTodos();
    else {
      // Offline fallback
      setTodos([
        { id: 1, text: "Review project proposal", completed: false, priority: 'high', category: 'work' },
        { id: 2, text: "Complete TypeScript tutorial", completed: true, priority: 'medium', category: 'study' },
        { id: 3, text: "Plan weekend activities", completed: false, priority: 'low', category: 'personal' }
      ]);
      setLoading(false);
    }
  }, [user]);

  const loadTodos = async () => {
    setLoading(true);
    const data = await db.getTodos();
    setTodos(data);
    setLoading(false);
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    const tempId = Date.now();
    const newTodoItem: Todo = { 
      id: tempId, 
      text: newTodo, 
      completed: false, 
      priority: newPriority, 
      category: newCategory 
    };

    setTodos(prev => [...prev, newTodoItem]);
    setNewTodo('');
    setShowAddModal(false);

    if (user) {
      setIsSaving(true);
      try {
        const savedTodo = await db.saveTodo({
          text: newTodoItem.text,
          completed: false,
          priority: newPriority,
          category: newCategory
        });
        if (savedTodo?.id) {
          setTodos(prev => prev.map(t => t.id === tempId ? { ...newTodoItem, id: savedTodo.id! } : t));
        }
      } catch (e) {
        console.error(e);
        setTodos(prev => prev.filter(t => t.id !== tempId));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const toggleTodo = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const updated = { ...todo, completed: !todo.completed };
    setTodos(prev => prev.map(t => t.id === id ? updated : t));

    if (user) {
      try {
        await db.updateTodo(id, { completed: updated.completed });
      } catch (e) {
        setTodos(prev => prev.map(t => t.id === id ? todo : t)); // Revert
      }
    }
  }, [todos, user]);

  const deleteTodo = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    setTodos(prev => prev.filter(t => t.id !== id));

    if (user) {
      try {
        await db.deleteTodo(id);
      } catch (e) {
        setTodos(prev => [...prev, todo]); // Revert
      }
    }
  }, [todos, user]);

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  if (!user) return <Auth />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ListTodo size={24} color={theme.colors.accent} />
          <Text style={styles.headerTitle}>Tasks</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <ProgressBar completed={todos.filter(t => t.completed).length} total={todos.length} />
        <FilterTabs currentFilter={filter} onChange={setFilter} />

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.accent} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredTodos}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TodoItem item={item} onToggle={toggleTodo} onDelete={deleteTodo} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tasks found</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Add Task Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <BlurView intensity={50} tint="dark" style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="What needs to be done?"
              placeholderTextColor={theme.colors.textSecondary}
              value={newTodo}
              onChangeText={setNewTodo}
              autoFocus
            />

            <View style={styles.optionsRow}>
              <Text style={styles.optionLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.optionChip, newCategory === cat && { backgroundColor: `${theme.colors.accent}33`, borderColor: theme.colors.accent }]}
                    onPress={() => setNewCategory(cat)}
                  >
                    {getCategoryIcon(cat)}
                    <Text style={[styles.optionText, newCategory === cat && { color: theme.colors.accent }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.optionsRow}>
              <Text style={styles.optionLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.optionChip, newPriority === p && { borderColor: PRIORITY_COLORS[p], backgroundColor: `${PRIORITY_COLORS[p]}20` }]}
                    onPress={() => setNewPriority(p)}
                  >
                    <Text style={[styles.optionText, newPriority === p && { color: PRIORITY_COLORS[p] }]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, !newTodo.trim() && styles.disabledButton]} 
              onPress={addTodo}
              disabled={!newTodo.trim() || isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Add Task</Text>}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: theme.spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  progressContainer: { marginBottom: theme.spacing.md },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: theme.colors.success, borderRadius: 3 },
  progressText: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'right' },
  filterContainer: { flexDirection: 'row', marginBottom: theme.spacing.md, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 4 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeFilterTab: { backgroundColor: 'rgba(255,255,255,0.1)' },
  filterText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 12 },
  activeFilterText: { color: theme.colors.textPrimary },
  listContent: { gap: 8, paddingBottom: 20 },
  todoItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.textSecondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkedBox: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  todoContent: { flex: 1 },
  todoText: { fontSize: 16, color: theme.colors.textPrimary, marginBottom: 6 },
  completedText: { color: theme.colors.textSecondary, textDecorationLine: 'line-through' },
  todoMeta: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 4 },
  badgeText: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600' },
  deleteButton: { padding: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: theme.colors.textSecondary, fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.bgSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16, color: theme.colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24 },
  optionsRow: { marginBottom: 20 },
  optionLabel: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 12, fontWeight: '600' },
  optionsScroll: { flexDirection: 'row' },
  priorityContainer: { flexDirection: 'row', gap: 12 },
  optionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8, gap: 6 },
  optionText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' },
  saveButton: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  disabledButton: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
