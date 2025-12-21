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
  Loader2,
  LogIn
} from 'lucide-react';
import todoStyles from '../../../styles/Todo.module.css';
import { useAppState } from '../../contexts/AppStateContext';
import { useDataPersistence } from '../../hooks/useDataPersistence';

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
    loadTodos, 
    saveTodo, 
    updateTodo, 
    deleteTodo: deleteTodoFromDb 
  } = useDataPersistence();
    const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'study' | 'health'>('work');  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isSaving, setIsSaving] = useState(false);
  // Load todos when user becomes authenticated
  useEffect(() => {
    const loadUserTodos = async () => {
      if (isAuthenticated) {
        // Loading todos for authenticated user
        const userTodos = await loadTodos();
        const formattedTodos: Todo[] = userTodos.map(todo => ({
          id: todo.id!,
          text: todo.text,
          completed: todo.completed,
          priority: todo.priority || 'medium',
          category: todo.category || 'work',
          dueDate: todo.due_date
        }));
        setTodos(formattedTodos);
      } else {
        // Loading default todos for offline mode
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
    };

    loadUserTodos();
  }, [isAuthenticated, loadTodos]);

  // Update context whenever todos change
  useEffect(() => {
    const pendingCount = todos.filter(todo => !todo.completed).length;
    updateTodoState({ pendingCount });
  }, [todos, updateTodoState]);
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

      // Optimistically update UI
      setTodos([...todos, newTodoItem]);
      setNewTodo('');
        if (isAuthenticated) {
        setIsSaving(true);
        try {
          const savedTodo = await saveTodo({
            text: newTodo,
            completed: false,
            priority: newPriority,
            category: newCategory
          });

          if (savedTodo) {
            // Replace temp todo with saved todo
            setTodos(prev => prev.map(todo => 
              todo.id === tempId 
                ? { ...newTodoItem, id: savedTodo.id! }
                : todo            ));
          } else {
            throw new Error('Failed to save todo - no data returned');
          }
        } catch (error) {
          // Revert on error
          setTodos(prev => prev.filter(todo => todo.id !== tempId));          console.error('Failed to save todo:', error);
        } finally {
          setIsSaving(false);
        }
      } else {
        // Todo added to local state (not authenticated)
      }
    }
  };
  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const updatedTodo = { ...todo, completed: !todo.completed };
    
    // Optimistically update UI
    setTodos(todos.map(t => 
      t.id === id ? updatedTodo : t
    ));

    if (isAuthenticated) {
      try {
        const result = await updateTodo(id, { completed: !todo.completed });
        if (result) {
          // Todo completion updated successfully
        }
      } catch (error) {
        // Revert on error
        setTodos(todos.map(t => 
          t.id === id ? todo : t
        ));
        console.error('Failed to update todo completion:', error);
      }
    } else {
      // Todo completion toggled locally (not authenticated)
    }
  };
  const deleteTodo = async (id: number) => {
    const todoToDelete = todos.find(t => t.id === id);
    if (!todoToDelete) return;

    // Optimistically update UI
    setTodos(todos.filter(todo => todo.id !== id));

    if (isAuthenticated) {
      try {
        const success = await deleteTodoFromDb(id);
        if (success) {
          // Todo deleted successfully from database
        } else {
          throw new Error('Failed to delete todo from database');
        }
      } catch (error) {
        // Revert on error
        setTodos(prev => [...prev, todoToDelete]);
        console.error('Failed to delete todo:', error);
      }
    } else {
      // Todo deleted locally (not authenticated)
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

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
  const completedCount = todos.filter(t => t.completed).length;

  // If user is not authenticated, show sign-in message
  if (!isAuthenticated) {
    return (
      <div className={todoStyles.container}>
        <div className={todoStyles.signInContainer}>
          <LogIn size={48} className={todoStyles.signInIcon} />
          <h2>Sign in to use Tasks</h2>
          <p>Please sign in to create and manage your tasks.</p>
        </div>
      </div>
    );
  }

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
          All <span className={todoStyles.count}>{todos.length}</span>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`${todoStyles.filterTab} ${filter === 'active' ? todoStyles.activeTab : ''}`}
        >
          Active <span className={todoStyles.count}>{todos.filter(t => !t.completed).length}</span>
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
