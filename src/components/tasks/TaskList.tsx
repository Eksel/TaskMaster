import { useState } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Plus, CheckSquare, Square, Trash2, Clock, X, ShoppingCart, Globe, Lock, PlayCircle, PauseCircle, CheckCircle } from 'lucide-react';
import TaskDetailsModal from '../ui/TaskDetailsModal';
import type { Task, ShoppingItem } from '../../contexts/TaskContext';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string, completed: boolean) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddTask: (task: {
    title: string;
    description?: string;
    dueDate?: Date;
    dueTime?: string;
    priority: 'low' | 'medium' | 'high';
    type?: 'regular' | 'shopping';
    shoppingItems?: Omit<ShoppingItem, 'id'>[];
    privacy?: 'public' | 'private';
  }) => Promise<void>;
  onToggleShoppingItem?: (taskId: string, itemId: string, completed: boolean, channelId?: string) => Promise<void>;
  canAddTasks?: boolean;
  canDeleteTask?: (task: Task) => boolean;
  channelId?: string;
  updateTask?: (id:string, task:Task) => Promise<void> 
}

const TaskList = ({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onAddTask,
  onToggleShoppingItem,
  canAddTasks = true,
  canDeleteTask = () => true,
  channelId,
  updateTask
}: TaskListProps) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: undefined as Date | undefined,
    dueTime: '',
    priority: 'low' as 'low' | 'medium' | 'high',
    type: 'regular' as 'regular' | 'shopping',
    shoppingItems: [] as { name: string; quantity?: number }[],
    privacy: 'private' as 'public' | 'private'
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskToAdd = {
        ...newTask,
        shoppingItems: newTask.type === 'shopping' ? newTask.shoppingItems : [],
        ...(channelId ? { channelId } : {}),
        ...(channelId ? {} : { privacy: newTask.privacy })
      };

      await onAddTask(taskToAdd);
      setNewTask({
        title: '',
        description: '',
        dueDate: undefined,
        dueTime: '',
        priority: 'low',
        type: 'regular',
        shoppingItems: [],
        privacy: 'private'
      });
      setShowAddTask(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleAddShoppingItem = () => {
    setNewTask(prev => ({
      ...prev,
      shoppingItems: [...prev.shoppingItems, { name: '', quantity: 1 }]
    }));
  };

  const handleRemoveShoppingItem = (index: number) => {
    setNewTask(prev => ({
      ...prev,
      shoppingItems: prev.shoppingItems.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateShoppingItem = (index: number, field: 'name' | 'quantity', value: string | number) => {
    setNewTask(prev => ({
      ...prev,
      shoppingItems: prev.shoppingItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleTaskCompletion = async (e: React.MouseEvent, taskId: string, completed: boolean) => {
    e.stopPropagation();
    try {
      await onToggleComplete(taskId, !completed);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const handleShoppingItemClick = async (e: React.MouseEvent, taskId: string, itemId: string, completed: boolean) => {
    e.stopPropagation();
    
    if (!onToggleShoppingItem) {
      console.warn('Shopping item toggle handler not provided');
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.warn(`Task not found: ${taskId}`);
      return;
    }

    if (!task.shoppingItems || !task.shoppingItems.some(item => item.id === itemId)) {
      console.warn(`Shopping item not found: ${itemId} in task: ${taskId}`);
      return;
    }

    try {
      await onToggleShoppingItem(taskId, itemId, !completed, task.channelId);
    } catch (error) {
      console.error('Failed to toggle shopping item:', {
        error,
        taskId,
        itemId,
        task
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <PlayCircle className="h-5 w-5 text-gray-400" />;
      case 'in_progress':
        return <PauseCircle className="h-5 w-5 text-warning-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      default:
        return null;
    }
  };

  const handleStatusChange = async (e: React.MouseEvent, taskId: string, newStatus: string) => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    task.status = newStatus;
    try {
      const completed = newStatus === 'completed';
      if(newStatus==="in_progress")await updateTask(taskId,task)
      else await onToggleComplete(taskId,completed)
      
      setStatusDropdownId(null);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const toggleStatusDropdown = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setStatusDropdownId(statusDropdownId === taskId ? null : taskId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {canAddTasks && (
          <button
            onClick={() => setShowAddTask(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Task
          </button>
        )}
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-md"
            onClick={() => setSelectedTask(task)}
          >
            <button
              onClick={(e) => handleTaskCompletion(e, task.id, task.completed)}
              className="mt-1 flex-shrink-0"
            >
              {task.completed ? (
                <CheckSquare className="h-5 w-5 text-primary-500" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3
                  className={`font-medium truncate ${
                    task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {task.type === 'shopping' && (
                    <ShoppingCart className="h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={`badge ${
                      task.priority === 'high'
                        ? 'badge-high'
                        : task.priority === 'medium'
                        ? 'badge-medium'
                        : 'badge-low'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`badge ${
                      task.completed || task.status === 'completed'
                        ? 'badge-high'
                        : task.status === 'in_progress'
                        ? 'badge-medium'
                        : 'badge-low'
                    }`}
                  >
                    {task.status || (task.completed ? 'completed' : 'not started')}
                  </span>
                  {!channelId && task.privacy && (
                    <span
                      className={`badge ${
                        task.privacy === 'public'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.privacy === 'public' ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
              )}
              
              {task.type === 'shopping' && task.shoppingItems && (
                <div className="mt-2 space-y-1">
                  {task.shoppingItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 w-fit text-sm"
                      onClick={(e) => handleShoppingItemClick(e, task.id, item.id, item.completed)}
                    >
                      <button className="flex items-center gap-2 ">
                        {item.completed ? (
                          <CheckSquare className="h-4 w-4 text-primary-500" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                        <span 
                          className={`cursor-pointer ${item.completed ? 'line-through text-gray-500' : ''}`}
                        >
                          {item.name} {item.quantity && `(${item.quantity})`}
                        </span>
                      </button>
                    </div>
                  ))}
                  {task.shoppingItems.length > 3 && (
                    <p className="text-sm text-gray-500">
                      +{task.shoppingItems.length - 3} more items
                    </p>
                  )}
                </div>
              )}
              
              {task.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Due {format(task.dueDate, 'PPP')}
                    {task.dueTime && ` at ${task.dueTime}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <div className="relative">
                <button
                  onClick={(e) => toggleStatusDropdown(e, task.id)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title={`Status: ${task.status || 'not_started'}`}
                >
                  {getStatusIcon(task.status || 'not_started')}
                </button>
                
                {statusDropdownId === task.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                    <button
                      onClick={(e) => handleStatusChange(e, task.id, 'not_started')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PlayCircle className="h-4 w-4 mr-2 text-gray-400" />
                      Not Started
                    </button>
                    <button
                      onClick={(e) => handleStatusChange(e, task.id, 'in_progress')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PauseCircle className="h-4 w-4 mr-2 text-warning-500" />
                      In Progress
                    </button>
                    <button
                      onClick={(e) => handleStatusChange(e, task.id, 'completed')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-success-500" />
                      Completed
                    </button>
                  </div>
                )}
              </div>

              {canDeleteTask(task) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="text-gray-400 hover:text-error-500 transition-colors p-1"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <p className="text-center text-gray-500 py-8">No tasks found</p>
        )}
      </div>

      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Add New Task</h2>
              <button
                onClick={() => setShowAddTask(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddTask}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="form-label">Task Type</label>
                  <select
                    className="form-input"
                    value={newTask.type}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        type: e.target.value as 'regular' | 'shopping',
                        shoppingItems: []
                      })
                    }
                  >
                    <option value="regular">Regular Task</option>
                    <option value="shopping">Shopping List</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {newTask.type === 'shopping' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label mb-0">Shopping Items</label>
                      <button
                        type="button"
                        onClick={handleAddShoppingItem}
                        className="btn btn-outline py-1 px-2 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {newTask.shoppingItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            className="form-input flex-1"
                            value={item.name}
                            onChange={(e) => handleUpdateShoppingItem(index, 'name', e.target.value)}
                            required
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            className="form-input w-20"
                            value={item.quantity}
                            onChange={(e) => handleUpdateShoppingItem(index, 'quantity', parseInt(e.target.value))}
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveShoppingItem(index)}
                            className="text-gray-400 hover:text-error-500"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Due Date</label>
                  <div className="bg-white border rounded-md p-2 overflow-x-auto">
                    <DayPicker
                      mode="single"
                      selected={newTask.dueDate}
                      onSelect={(date) =>
                        setNewTask({ ...newTask, dueDate: date || undefined })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Due Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newTask.dueTime}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueTime: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as 'low' | 'medium' | 'high',
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {!channelId && (
                  <div>
                    <label className="form-label">Privacy</label>
                    <select
                      className="form-input"
                      value={newTask.privacy}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          privacy: e.target.value as 'public' | 'private',
                        })
                      }
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 p-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onToggleShoppingItem={onToggleShoppingItem}
        />
      )}
    </div>
  );
};

export default TaskList;