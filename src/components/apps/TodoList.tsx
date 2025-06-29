"use client";
import { useState, useEffect } from 'react';
import { 
  X,
  Plus,
  CheckSquare,
  Target,
  Heart,
  BookOpen,
  Zap,
  Loader2
} from 'lucide-react';
import todoStyles from '../../../styles/Todo.module.css';
import { useAppState } from '../../contexts/AppStateContext';
import { useDataPersistence } from '../../hooks/useDataPersistence';
import { useRealtimeTodos } from '../../hooks/useRealtime';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'study' | 'health';
  dueDate?: string;
}

const TodoList: React.FC = () => {
  const { updateTodoState } = useAppState();
  const { 
    isAuthenticated, 
    saveTodo, 
    updateTodo, 
    deleteTodo: deleteTodoFromDb 
  } = useDataPersistence();
  
  // Use realtime todos when authenticated, fallback to local state when not
  const { todos: realtimeTodos } = useRealtimeTodos();
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'study' | 'health'>('work');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Use realtime todos when authenticated, local todos when not
  const displayTodos = isAuthenticated ? realtimeTodos.map(todo => ({
    id: todo.id!,
    text: todo.text,
    completed: todo.completed,
    priority: todo.priority || 'medium',
    category: todo.category || 'work',
    dueDate: todo.due_date
  })) : todos;
  // Load todos when user becomes authenticated (only for local mode)
  useEffect(() => {
    const loadUserTodos = async () => {
      if (!isAuthenticated) {
        console.log('Loading default todos for offline mode');
        // Load default todos when not authenticated
        setTodos([
          { 
            id: 1, 
            text: "Review project proposal", 
            completed: false,
            priority: 'high',
            category: 'work'
          },
          { 
            id: 2, 
            text: "Complete TypeScript tutorial", 
            completed: true,
            priority: 'medium',
            category: 'study'
          },
          { 
            id: 3, 
            text: "Plan weekend activities", 
            completed: false,
            priority: 'low',
            category: 'personal'
          }
        ]);
      }
      // Note: When authenticated, realtime hook handles loading from database
    };

    loadUserTodos();
  }, [isAuthenticated]);

  // Update context whenever todos change
  useEffect(() => {
    const pendingCount = displayTodos.filter(todo => !todo.completed).length;
    updateTodoState({ pendingCount });
  }, [displayTodos, updateTodoState]);
  const addTodo = async () => {
    if (newTodo.trim()) {
      const tempId = Date.now();
      const newTodoItem: Todo = { 
        id: tempId, 
        text: newTodo, 
        completed: false,
        priority: newPriority,
        category: newCategory
      };

      // For local mode, optimistically update UI
      if (!isAuthenticated) {
        setTodos([...todos, newTodoItem]);
        setNewTodo('');
        console.log('Todo added to local state (not authenticated)');
        return;
      }

      // For authenticated users, save directly and let realtime update UI
      setIsSaving(true);
      try {
        console.log('Adding new todo:', newTodoItem);
        const savedTodo = await saveTodo({
          text: newTodo,
          completed: false,
          priority: newPriority,
          category: newCategory
        });

        if (savedTodo) {
          console.log('Todo saved successfully:', savedTodo);
          setNewTodo(''); // Clear input after successful save
        } else {
          throw new Error('Failed to save todo - no data returned');
        }
      } catch (error) {
        console.error('Failed to save todo:', error);
        // Show error to user if needed
      } finally {
        setIsSaving(false);
      }
    }
  };
  const toggleTodo = async (id: number) => {
    const todo = displayTodos.find(t => t.id === id);
    if (!todo) return;

    if (!isAuthenticated) {
      // For local mode, update local state
      const updatedTodo = { ...todo, completed: !todo.completed };
      setTodos(todos.map(t => 
        t.id === id ? updatedTodo : t
      ));
      console.log('Todo completion toggled locally (not authenticated)');
      return;
    }

    // For authenticated users, update database and let realtime handle UI update
    try {
      console.log('Toggling todo completion:', id, 'to', !todo.completed);
      const result = await updateTodo(id, { completed: !todo.completed });
      if (result) {
        console.log('Todo completion updated successfully:', result);
      }
    } catch (error) {
      console.error('Failed to update todo completion:', error);
      // Show error to user if needed
    }
  };
  const deleteTodo = async (id: number) => {
    const todoToDelete = displayTodos.find(t => t.id === id);
    if (!todoToDelete) return;

    if (!isAuthenticated) {
      // For local mode, update local state
      setTodos(todos.filter(todo => todo.id !== id));
      console.log('Todo deleted locally (not authenticated)');
      return;
    }

    // For authenticated users, delete from database and let realtime handle UI update
    try {
      console.log('Deleting todo:', id, todoToDelete.text);
      const success = await deleteTodoFromDb(id);
      if (success) {
        console.log('Todo deleted successfully from database');
      } else {
        throw new Error('Failed to delete todo from database');
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // Show error to user if needed
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

  const filteredTodos = displayTodos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
  const completedCount = displayTodos.filter(t => t.completed).length;

  return (
    <div className={todoStyles.content}>
      {/* Progress Bar */}
      {displayTodos.length > 0 && (
        <div className={todoStyles.progressSection}>
          <div className={todoStyles.progressBar}>
            <div 
              className={todoStyles.progressFill}
              style={{ width: `${displayTodos.length > 0 ? (completedCount / displayTodos.length) * 100 : 0}%` }}
            />
          </div>
          <span className={todoStyles.progressText}>
            {completedCount} of {displayTodos.length} tasks completed ({Math.round(displayTodos.length > 0 ? (completedCount / displayTodos.length) * 100 : 0)}%)
          </span>
        </div>
      )}

      {/* Add Todo Form */}
      <div className={todoStyles.addSection}>
        <div className={todoStyles.inputGroup}>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            className={todoStyles.taskInput}
            disabled={isSaving}
          />
          <button 
            onClick={addTodo} 
            className={todoStyles.addButton}
            disabled={isSaving || !newTodo.trim()}
          >
            {isSaving ? <Loader2 size={18} className={todoStyles.spinner} /> : <Plus size={18} />}
          </button>
        </div>
        
        <div className={todoStyles.optionsRow}>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as 'work' | 'personal' | 'study' | 'health')}
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
            onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
            className={todoStyles.prioritySelect}
            disabled={isSaving}
          >
            <option value="low">🔵 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={todoStyles.filterTabs}>
        <button
          onClick={() => setFilter('all')}
          className={`${todoStyles.filterTab} ${filter === 'all' ? todoStyles.activeTab : ''}`}
        >
          All <span className={todoStyles.count}>{displayTodos.length}</span>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`${todoStyles.filterTab} ${filter === 'active' ? todoStyles.activeTab : ''}`}
        >
          Active <span className={todoStyles.count}>{displayTodos.filter(t => !t.completed).length}</span>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`${todoStyles.filterTab} ${filter === 'completed' ? todoStyles.activeTab : ''}`}
        >
          Done <span className={todoStyles.count}>{completedCount}</span>
        </button>
      </div>

      {/* Todo List */}
      <div className={todoStyles.taskList}>
        {filteredTodos.map(todo => (
          <div key={todo.id} className={`${todoStyles.taskItem} ${todo.completed ? todoStyles.taskCompleted : ''}`}>
            <button
              onClick={() => toggleTodo(todo.id)}
              className={`${todoStyles.checkButton} ${todo.completed ? todoStyles.checked : ''}`}
            >
              <div className={todoStyles.checkmark}>
                {todo.completed && <CheckSquare size={16} />}
              </div>
            </button>
            
            <div className={todoStyles.taskContent}>
              <span className={todoStyles.taskText}>{todo.text}</span>
              <div className={todoStyles.taskMeta}>
                <span className={`${todoStyles.categoryBadge} ${todoStyles[`category${todo.category.charAt(0).toUpperCase() + todo.category.slice(1)}`]}`}>
                  {getCategoryIcon(todo.category)}
                  {todo.category}
                </span>
                <span className={`${todoStyles.priorityBadge} ${todoStyles[`priority${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`]}`}>
                  {todo.priority}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => deleteTodo(todo.id)}
              className={todoStyles.deleteButton}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {filteredTodos.length === 0 && (
          <div className={todoStyles.emptyState}>
            <div className={todoStyles.emptyIcon}>
              {filter === 'completed' ? '🎉' : filter === 'active' ? '📝' : '✨'}
            </div>
            <h3 className={todoStyles.emptyTitle}>
              {filter === 'completed' 
                ? 'No completed tasks yet' 
                : filter === 'active' 
                ? 'No active tasks' 
                : 'Ready to get things done?'}
            </h3>
            <p className={todoStyles.emptyMessage}>
              {filter === 'completed' 
                ? 'Complete some tasks to see them here' 
                : filter === 'active' 
                ? 'All tasks completed! Great job!' 
                : 'Add your first task above to get started'}
            </p>
          </div>        )}
      </div>
    </div>
  );
};

export default TodoList;
