"use client";
import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Pencil,
  CalendarDays,
  CheckSquare,
  Target,
  Heart,
  BookOpen,
  Zap,
  Loader2,
  Search,
  Timer,
} from 'lucide-react';
import todoStyles from '../../../styles/Todo.module.css';
import { useAppState } from '../../contexts/AppStateContext';
import { useDataPersistence } from '../../hooks/useDataPersistence';
import type { Todo } from '../../lib/database';
import { localDate } from '../../lib/api';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { openApp } from '../../lib/ui';

const PRIORITY_RANK: Record<Todo['priority'], number> = { high: 0, medium: 1, low: 2 };

const formatDue = (date: string) => {
  const today = localDate();
  if (date === today) return 'Today';
  const [y, m, d] = date.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (localDate(tomorrow) === date) return 'Tomorrow';
  return due.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

type Priority = Todo['priority'];
type Category = Todo['category'];

const TodoList: React.FC = () => {
  const { updateTodoState } = useAppState();
  const { db, isAuthenticated, authLoading } = useDataPersistence();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newCategory, setNewCategory] = useState<Category>('work');
  const [filter, setFilter] = useState<'all' | 'today' | 'active' | 'completed'>('active');
  const [query, setQuery] = useState('');
  const [newEstimate, setNewEstimate] = useState(0);
  const pomo = usePomodoro();
  const [isSaving, setIsSaving] = useState(false);
  const [newDue, setNewDue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // (Re)load whenever the user signs in or out
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    db.getTodos().then((items) => {
      if (cancelled) return;
      setTodos(items);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [db, isAuthenticated, authLoading]);

  useEffect(() => {
    updateTodoState({ pendingCount: todos.filter(todo => !todo.completed).length });
  }, [todos, updateTodoState]);

  // The focus timer credits finished sessions to a task.
  useEffect(() => {
    const onUpdated = (e: Event) => {
      const updated = (e as CustomEvent<Todo>).detail;
      setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    };
    window.addEventListener('lofi:todo-updated', onUpdated);
    return () => window.removeEventListener('lofi:todo-updated', onUpdated);
  }, []);

  const focusOn = (todo: Todo) => {
    if (pomo.task?.id === todo.id) {
      pomo.setTask(null);
      return;
    }
    pomo.setTask({ id: todo.id, text: todo.text });
    openApp('pomodoro');
  };

  const addTodo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = newTodo.trim();
    if (!text || isSaving) return;

    setIsSaving(true);
    const saved = await db.saveTodo({
      text,
      completed: false,
      priority: newPriority,
      category: newCategory,
      pomodoros: 0,
      estimate: newEstimate,
      ...(newDue ? { due_date: newDue } : {}),
    });
    setIsSaving(false);
    if (saved) {
      setTodos(prev => [...prev, saved]);
      setNewTodo('');
      setNewDue('');
      setNewEstimate(0);
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
    const result = await db.updateTodo(id, { completed: !todo.completed });
    if (!result) {
      setTodos(prev => prev.map(t => (t.id === id ? todo : t)));
    }
  };

  const deleteTodo = async (id: string) => {
    const index = todos.findIndex(t => t.id === id);
    if (index < 0) return;
    const removed = todos[index];
    setTodos(prev => prev.filter(t => t.id !== id));
    const ok = await db.deleteTodo(id);
    if (!ok) {
      setTodos(prev => {
        const next = [...prev];
        next.splice(index, 0, removed);
        return next;
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return <Target size={16} className={todoStyles.categoryIcon} />;
      case 'personal': return <Heart size={16} className={todoStyles.categoryIcon} />;
      case 'study': return <BookOpen size={16} className={todoStyles.categoryIcon} />;
      case 'health': return <Zap size={16} className={todoStyles.categoryIcon} />;
      default: return <CheckSquare size={16} />;
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const commitEdit = async () => {
    const id = editingId;
    const text = editText.trim();
    setEditingId(null);
    const original = todos.find(t => t.id === id);
    if (!id || !original || !text || text === original.text) return;
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, text } : t)));
    if (!(await db.updateTodo(id, { text }))) {
      setTodos(prev => prev.map(t => (t.id === id ? original : t)));
    }
  };

  const clearCompleted = async () => {
    const done = todos.filter(t => t.completed);
    setTodos(prev => prev.filter(t => !t.completed));
    const results = await Promise.all(done.map(t => db.deleteTodo(t.id)));
    const failed = done.filter((_, i) => !results[i]);
    if (failed.length) setTodos(prev => [...prev, ...failed]);
  };

  // Open tasks first; then by due date, priority, and creation order.
  const today = localDate();
  const q = query.trim().toLowerCase();
  const filteredTodos = useMemo(() => todos
    .filter(todo => {
      if (q && !todo.text.toLowerCase().includes(q) && !todo.category.includes(q)) return false;
      if (filter === 'today') return !todo.completed && Boolean(todo.due_date) && todo.due_date! <= today;
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .map((todo, index) => ({ todo, index }))
    .sort((a, b) =>
      Number(a.todo.completed) - Number(b.todo.completed) ||
      (a.todo.due_date || '9999').localeCompare(b.todo.due_date || '9999') ||
      PRIORITY_RANK[a.todo.priority] - PRIORITY_RANK[b.todo.priority] ||
      a.index - b.index
    )
    .map(({ todo }) => todo), [todos, filter, q, today]);
  const dueTodayCount = todos.filter(t => !t.completed && t.due_date && t.due_date <= today).length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className={todoStyles.content}>
      {/* Progress Bar */}
      {todos.length > 0 && (
        <div className={todoStyles.progressSection}>
          <div className={todoStyles.progressBar}>
            <div 
              className={todoStyles.progressFill}
              style={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
            />
          </div>
          <span className={todoStyles.progressText}>
            {completedCount} of {todos.length} tasks completed ({Math.round(todos.length > 0 ? (completedCount / todos.length) * 100 : 0)}%)
          </span>
        </div>
      )}

      {/* Add Todo Form */}
      <form className={todoStyles.addSection} onSubmit={addTodo}>
        <div className={todoStyles.inputGroup}>
          <input
            type="text"
            placeholder="What needs to be done?"
            aria-label="New task"
            value={newTodo}
            maxLength={500}
            onChange={(e) => setNewTodo(e.target.value)}
            className={todoStyles.taskInput}
            disabled={isSaving}
          />
          <button
            type="submit"
            className={todoStyles.addButton}
            disabled={isSaving || !newTodo.trim()}
            aria-label="Add task"
          >
            {isSaving ? <Loader2 size={18} className={todoStyles.spinner} /> : <Plus size={18} />}
          </button>
        </div>
        
        <div className={todoStyles.optionsRow}>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as Category)}
            aria-label="Category"
            className={todoStyles.categorySelect}
            disabled={isSaving}
          >
            <option value="work">📊 Work</option>
            <option value="personal">🏠 Personal</option>
            <option value="study">📚 Study</option>
            <option value="health">💪 Health</option>
          </select>
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            aria-label="Priority"
            className={todoStyles.prioritySelect}
            disabled={isSaving}
          >
            <option value="low">🔵 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
          <select
            value={newEstimate}
            onChange={(e) => setNewEstimate(Number(e.target.value))}
            aria-label="Estimated focus sessions"
            title="How many focus sessions will this take?"
            className={todoStyles.prioritySelect}
            disabled={isSaving}
          >
            <option value={0}>🍅 Est.</option>
            {[1, 2, 3, 4, 5, 6, 8].map(n => (
              <option key={n} value={n}>🍅 {n}</option>
            ))}
          </select>
          <label className={todoStyles.dueInput} title="Due date (optional)">
            <CalendarDays size={14} aria-hidden />
            <input
              type="date"
              value={newDue}
              min={today}
              onChange={(e) => setNewDue(e.target.value)}
              aria-label="Due date"
              disabled={isSaving}
            />
          </label>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className={todoStyles.filterTabs}>
        <button
          onClick={() => setFilter('active')}
          className={`${todoStyles.filterTab} ${filter === 'active' ? todoStyles.activeTab : ''}`}
        >
          Open <span className={todoStyles.count}>{todos.filter(t => !t.completed).length}</span>
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`${todoStyles.filterTab} ${filter === 'today' ? todoStyles.activeTab : ''}`}
          title="Due today or overdue"
        >
          Today <span className={todoStyles.count}>{dueTodayCount}</span>
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`${todoStyles.filterTab} ${filter === 'all' ? todoStyles.activeTab : ''}`}
        >
          All <span className={todoStyles.count}>{todos.length}</span>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`${todoStyles.filterTab} ${filter === 'completed' ? todoStyles.activeTab : ''}`}
        >
          Done <span className={todoStyles.count}>{completedCount}</span>
        </button>
      </div>

      {todos.length > 5 && (
        <label className={todoStyles.searchBox}>
          <Search size={14} aria-hidden />
          <input
            type="search"
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </label>
      )}

      {completedCount > 0 && (filter === 'completed' || filter === 'all') && (
        <button type="button" className={todoStyles.clearDone} onClick={clearCompleted}>
          Clear {completedCount} completed
        </button>
      )}

      {/* Todo List */}
      <div className={todoStyles.taskList}>
        {filteredTodos.map(todo => (
          <div key={todo.id} className={`${todoStyles.taskItem} ${todo.completed ? todoStyles.taskCompleted : ''}`}>
            <button
              onClick={() => toggleTodo(todo.id)}
              className={`${todoStyles.checkButton} ${todo.completed ? todoStyles.checked : ''}`}
              aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
              aria-pressed={todo.completed}
            >
              <div className={todoStyles.checkmark}>
                {todo.completed && <CheckSquare size={16} />}
              </div>
            </button>
            
            <div className={todoStyles.taskContent}>
              {editingId === todo.id ? (
                <input
                  className={todoStyles.editInput}
                  value={editText}
                  maxLength={500}
                  autoFocus
                  aria-label="Edit task"
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setEditingId(null);
                    }
                  }}
                />
              ) : (
                <span className={todoStyles.taskText} onDoubleClick={() => startEdit(todo)}>
                  {todo.text}
                </span>
              )}
              <div className={todoStyles.taskMeta}>
                {todo.due_date && (
                  <span
                    className={`${todoStyles.dueBadge} ${!todo.completed && todo.due_date < today ? todoStyles.overdue : ''}`}
                  >
                    <CalendarDays size={11} aria-hidden />
                    {!todo.completed && todo.due_date < today ? 'Overdue · ' : ''}
                    {formatDue(todo.due_date)}
                  </span>
                )}
                <span className={`${todoStyles.categoryBadge} ${todoStyles[`category${todo.category.charAt(0).toUpperCase() + todo.category.slice(1)}`]}`}>
                  {getCategoryIcon(todo.category)}
                  {todo.category}
                </span>
                <span className={`${todoStyles.priorityBadge} ${todoStyles[`priority${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`]}`}>
                  {todo.priority}
                </span>
                {((todo.pomodoros ?? 0) > 0 || (todo.estimate ?? 0) > 0) && (
                  <span
                    className={`${todoStyles.pomoBadge} ${todo.estimate && (todo.pomodoros ?? 0) >= todo.estimate ? todoStyles.pomoDone : ''}`}
                    title={`${todo.pomodoros ?? 0} focus sessions${todo.estimate ? ` of ${todo.estimate} planned` : ''}`}
                  >
                    🍅 {todo.pomodoros ?? 0}
                    {todo.estimate ? `/${todo.estimate}` : ''}
                  </span>
                )}
              </div>
            </div>
            
            {!todo.completed && (
              <button
                onClick={() => focusOn(todo)}
                className={`${todoStyles.deleteButton} ${todoStyles.editButton} ${pomo.task?.id === todo.id ? todoStyles.focusing : ''}`}
                aria-label={pomo.task?.id === todo.id ? 'Stop focusing on this task' : 'Focus on this task'}
                aria-pressed={pomo.task?.id === todo.id}
                title={pomo.task?.id === todo.id ? 'Focusing — click to stop' : 'Focus on this task'}
              >
                <Timer size={14} />
              </button>
            )}
            <button
              onClick={() => startEdit(todo)}
              className={`${todoStyles.deleteButton} ${todoStyles.editButton}`}
              aria-label="Edit task"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => deleteTodo(todo.id)}
              className={todoStyles.deleteButton}
              aria-label="Delete task"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {loading && (
          <div className={todoStyles.emptyState}>
            <Loader2 size={24} className={todoStyles.spinner} />
          </div>
        )}

        {!loading && filteredTodos.length === 0 && (
          <div className={todoStyles.emptyState}>
            <div className={todoStyles.emptyIcon}>
              {q ? '🔍' : filter === 'completed' ? '🎉' : filter === 'today' ? '☀️' : filter === 'active' ? '📝' : '✨'}
            </div>
            <h3 className={todoStyles.emptyTitle}>
              {q
                ? 'No matching tasks'
                : filter === 'completed'
                ? 'No completed tasks yet'
                : filter === 'today'
                ? 'Nothing due today'
                : filter === 'active'
                ? todos.length ? 'All done!' : 'Ready to get things done?'
                : 'Ready to get things done?'}
            </h3>
            <p className={todoStyles.emptyMessage}>
              {q
                ? 'Try a different word'
                : filter === 'completed'
                ? 'Complete some tasks to see them here'
                : filter === 'today'
                ? 'Tasks with a due date of today or earlier show up here'
                : filter === 'active'
                ? todos.length ? 'Every task is checked off. Great job!' : 'Add your first task above to get started'
                : 'Add your first task above to get started'}
            </p>
          </div>        )}
      </div>
    </div>
  );
};

export default TodoList;
