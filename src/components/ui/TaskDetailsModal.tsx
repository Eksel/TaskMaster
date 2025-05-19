import { format } from 'date-fns';
import { X, CheckSquare, Square, ShoppingCart, User, ArrowRight, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Task } from '../../contexts/TaskContext';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onToggleShoppingItem?: (taskId: string, itemId: string, completed: boolean, channelId?: string) => Promise<void>;
}

const TaskDetailsModal = ({ task, onClose, onToggleShoppingItem }: TaskDetailsModalProps) => {
  const [currentTask, setCurrentTask] = useState(task);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', task.createdBy));
        if (userDoc.exists()) {
          setAuthorName(userDoc.data().displayName || 'Unknown User');
        }
      } catch (error) {
        console.error('Error fetching author:', error);
        setAuthorName('Unknown User');
      }
    };

    const fetchChannel = async () => {
      if (task.channelId) {
        try {
          const channelDoc = await getDoc(doc(db, 'channels', task.channelId));
          if (channelDoc.exists()) {
            setChannelName(channelDoc.data().name);
          }
        } catch (error) {
          console.error('Error fetching channel:', error);
          setChannelName('Unknown Channel');
        }
      }
    };

    fetchAuthor();
    fetchChannel();
  }, [task.createdBy, task.channelId]);
  
  const handleShoppingItemToggle = async (itemId: string, completed: boolean) => {
    if (!onToggleShoppingItem) return;
    try {
      await onToggleShoppingItem(task.id, itemId, !completed, task.channelId);
      
      // Update the local task state to reflect the change
      setCurrentTask(prevTask => ({
        ...prevTask,
        shoppingItems: prevTask.shoppingItems?.map(item =>
          item.id === itemId ? { ...item, completed: !completed } : item
        ),
        status: prevTask.shoppingItems?.every(item => 
          item.id === itemId ? !completed : item.completed
        ) ? 'completed' : 'in_progress'
      }));
    } catch (error) {
      console.error('Failed to toggle shopping item:', error);
    }
  };

  // Check if we should show the "Go to task" button
  const shouldShowGoToTask = () => {
    // Hide button if we're already in todo, channels, or user profile
    return !['/todo', '/channels', '/user'].some(path => 
      location.pathname.startsWith(path)
    );
  };

  const handleGoToTask = () => {
    if (currentTask.channelId) {
      // For channel tasks, navigate to the channel's tasks tab
      navigate(`/channels/${currentTask.channelId}`, { state: { activeTab: 'tasks' } });
    } else if (currentTask.createdBy !== currentUser?.uid && currentTask.privacy === 'public') {
      // For public tasks created by other users, navigate to their profile
      navigate(`/user/${currentTask.createdBy}`);
    } else {
      navigate('/todo');
    }
    onClose();
  };

  // Check if we should show shopping item toggles
  const shouldShowToggles = () => {
    return location.pathname === '/todo' || location.pathname.startsWith('/channels');
  };

  return (
    <div className="modal-overlay ">
      <div className="modal-container animate-fade-in">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
            {currentTask.type === 'shopping' && (
              <ShoppingCart className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Title</h3>
            <p className="mt-1 text-lg text-gray-900">{currentTask.title}</p>
          </div>

          {currentTask.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-900">{currentTask.description}</p>
            </div>
          )}

          {currentTask.type === 'shopping' && currentTask.shoppingItems && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Shopping Items</h3>
              <div className="space-y-2">
                {currentTask.shoppingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2"
                  >
                    {shouldShowToggles() ? (
                      <button
                        onClick={() => handleShoppingItemToggle(item.id, item.completed)}
                        className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-md w-full transition-colors"
                      >
                        {item.completed ? (
                          <CheckSquare className="h-4 w-4 text-primary-500" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={item.completed ? 'line-through text-gray-500' : ''}>
                          {item.name} {item.quantity && `(${item.quantity})`}
                        </span>
                      </button>
                    ) : (
                      <div className={`p-1 w-full ${item.completed ? 'text-gray-500 line-through' : ''}`}>
                        {item.name} {item.quantity && `(${item.quantity})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Priority</h3>
              <span
                className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentTask.priority === 'high'
                    ? 'bg-error-100 text-error-800'
                    : currentTask.priority === 'medium'
                    ? 'bg-warning-100 text-warning-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {currentTask.priority}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <span
                className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  
                     currentTask.status === 'completed'
                      ? 'bg-success-100 text-success-800'
                      : currentTask.status === 'in_progress'
                      ? 'bg-warning-100 text-warning-800'
                      : 'bg-gray-100 text-gray-800'
                    
                }`}
              >
                {currentTask.status?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {currentTask.dueDate && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              <p className="mt-1 text-gray-900">
                {format(currentTask.dueDate, 'PPP')}
                {currentTask.dueTime && ` at ${currentTask.dueTime}`}
              </p>
            </div>
          )}

          {channelName && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Channel</h3>
              <div className="mt-1 flex items-center gap-2 text-gray-900">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary-600" />
                  <span>#{channelName}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Created By</h3>
            <div className="mt-1 flex items-center gap-2 text-gray-900">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <span>{authorName}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="mt-1 text-gray-900">
              {format(currentTask.createdAt, 'PPP')}
            </p>
          </div>
        </div>

        <div className="modal-footer flex gap-2">
          <button
            onClick={onClose}
            className="btn btn-outline flex-1"
          >
            Close
          </button>
          {shouldShowGoToTask() && (
            <button
              onClick={handleGoToTask}
              className="btn btn-primary flex items-center justify-center gap-2"
            >
              {currentTask.createdBy !== currentUser?.uid && currentTask.privacy === 'public'
                ? "View Creator's Profile"
                : 'Go to task'}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;