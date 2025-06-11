"use client";
import { useState } from 'react';
import { 
  X,
  Plus,
  Award,
  CheckSquare,
  Target,
  Heart,
  BookOpen,
  Zap
} from 'lucide-react';
import todoStyles from '../../../styles/Todo.module.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'study' | 'health';
  dueDate?: string;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'study' | 'health'>('work');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: newTodo, 
        completed: false,
        priority: newPriority,
        category: newCategory
      }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
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
  const progressPercentage = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className={todoStyles.content}>
      {/* Progress Bar */}
      {todos.length > 0 && (
        <div className={todoStyles.progressSection}>
          <div className={todoStyles.progressBar}>
            <div 
              className={todoStyles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className={todoStyles.progressText}>
            {completedCount} of {todos.length} tasks completed ({Math.round(progressPercentage)}%)
          </div>
        </div>
      )}

      {/* Add Todo Form */}
      <div className={todoStyles.addTodoForm}>
        <div className={todoStyles.inputGroup}>
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            className={todoStyles.todoInput}
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
            className={todoStyles.prioritySelect}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as 'work' | 'personal' | 'study' | 'health')}
            className={todoStyles.categorySelect}
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="study">Study</option>
            <option value="health">Health</option>
          </select>
          <button onClick={addTodo} className={todoStyles.addButton}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className={todoStyles.filterButtons}>
        <button
          onClick={() => setFilter('all')}
          className={`${todoStyles.filterButton} ${filter === 'all' ? todoStyles.active : ''}`}
        >
          All ({todos.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`${todoStyles.filterButton} ${filter === 'active' ? todoStyles.active : ''}`}
        >
          Active ({todos.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`${todoStyles.filterButton} ${filter === 'completed' ? todoStyles.active : ''}`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Todo List */}
      <div className={todoStyles.todoList}>
        {filteredTodos.map(todo => (
          <div key={todo.id} className={`${todoStyles.todoItem} ${todo.completed ? todoStyles.completed : ''}`}>
            <div className={todoStyles.todoContent}>
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`${todoStyles.checkButton} ${todo.completed ? todoStyles.checked : ''}`}
              >
                <CheckSquare size={16} />
              </button>
              <div className={todoStyles.todoDetails}>
                <span className={todoStyles.todoText}>{todo.text}</span>
                <div className={todoStyles.todoMeta}>
                  {getCategoryIcon(todo.category)}
                  <span className={`${todoStyles.priority} ${todoStyles[todo.priority]}`}>
                    {todo.priority}
                  </span>
                </div>
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
            <Award size={32} className={todoStyles.emptyIcon} />
            <p>
              {filter === 'completed' 
                ? 'No completed tasks yet' 
                : filter === 'active' 
                ? 'No active tasks' 
                : 'No tasks yet. Add one above!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
