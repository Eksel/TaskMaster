import { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { useChannels } from '../contexts/ChannelContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { CheckSquare, Calendar, Users, Clock, X } from 'lucide-react';
import TaskDetailsModal from '../components/ui/TaskDetailsModal';

type TabType = 'all' | 'channels';
type ViewType = 'not_started' | 'ongoing' | 'completed' | null;

const Dashboard = () => {
  const { tasks, loading } = useTasks();
  const { joinedChannels } = useChannels();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewAll, setViewAll] = useState<ViewType>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Filter tasks to only include user's personal tasks and channel tasks
  const personalTasks = tasks.filter(task => !task.channelId && task.createdBy === currentUser?.uid);
  const channelTasks = tasks.filter(task => task.channelId && joinedChannels.some(channel => channel.id === task.channelId));
  const totalTasks = [...personalTasks, ...channelTasks];

  const getDisplayTasks = () => {
    return activeTab === 'channels' ? channelTasks : personalTasks;
  };

  const displayTasks = getDisplayTasks();

  // Separate tasks by status
  const notStartedTasks = displayTasks.filter(task => task.status === 'not_started');
  const ongoingTasks = displayTasks.filter(task => task.status === 'in_progress');
  const completedTasks = displayTasks.filter(task => task.status === 'completed');

  // Get all completed tasks count (both personal and channel tasks)
  const totalCompletedTasks = totalTasks.filter(task => task.status === 'completed').length;

  // Get all active tasks count (both personal and channel tasks that are not completed)
  const totalActiveTasks = totalTasks.filter(task => 
    (task.status === 'not_started' || task.status === 'in_progress')
  ).length;

  const TaskCard = ({ task }: { task: any }) => (
    <div 
      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedTask(task)}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
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
      </div>
      {task.description && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{format(task.dueDate, 'MMM d')}</span>
          </div>
        )}
        {task.channelId && (
          <span className="flex items-center gap-1 text-primary-600">
            <Users className="h-4 w-4" />
            <span>Channel Task</span>
          </span>
        )}
      </div>
    </div>
  );

  const getViewAllTasks = () => {
    switch (viewAll) {
      case 'not_started':
        return notStartedTasks;
      case 'in_progress':
        return ongoingTasks;
      case 'completed':
        return completedTasks;
      default:
        return [];
    }
  };

  const getViewAllTitle = () => {
    switch (viewAll) {
      case 'not_started':
        return 'Not Started Tasks';
      case 'in_progress':
        return 'In Progress Tasks';
      case 'completed':
        return 'Completed Tasks';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTasks.length}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCompletedTasks}</p>
            </div>
            <Calendar className="h-8 w-8 text-secondary-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{totalActiveTasks}</p>
            </div>
            <Users className="h-8 w-8 text-accent-500" />
          </div>
        </div>
      </div>

      {/* Task Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`
              flex items-center px-1 py-4 border-b-2 font-medium text-sm
              ${activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Personal Tasks
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`
              flex items-center px-1 py-4 border-b-2 font-medium text-sm
              ${activeTab === 'channels'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Channel Tasks
          </button>
        </nav>
      </div>

      {/* Task Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Not Started Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Not Started</h2>
            <span className="badge badge-low">{notStartedTasks.length}</span>
          </div>
          <div className="space-y-4">
            {notStartedTasks.slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            {notStartedTasks.length === 0 && (
              <p className="text-center text-gray-500 py-4">No tasks to show</p>
            )}
            {notStartedTasks.length > 5 && (
              <button
                onClick={() => setViewAll('not_started')}
                className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 mt-4"
              >
                View all ({notStartedTasks.length})
              </button>
            )}
          </div>
        </div>

        {/* Ongoing Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ongoing</h2>
            <span className="badge badge-medium">{ongoingTasks.length}</span>
          </div>
          <div className="space-y-4">
            {ongoingTasks.slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            {ongoingTasks.length === 0 && (
              <p className="text-center text-gray-500 py-4">No tasks to show</p>
            )}
            {ongoingTasks.length > 5 && (
              <button
                onClick={() => setViewAll('ongoing')}
                className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 mt-4"
              >
                View all ({ongoingTasks.length})
              </button>
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Completed</h2>
            <span className="badge badge-high">{completedTasks.length}</span>
          </div>
          <div className="space-y-4">
            {completedTasks.slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            {completedTasks.length === 0 && (
              <p className="text-center text-gray-500 py-4">No tasks to show</p>
            )}
            {completedTasks.length > 5 && (
              <button
                onClick={() => setViewAll('completed')}
                className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 mt-4"
              >
                View all ({completedTasks.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View All Modal */}
      {viewAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{getViewAllTitle()}</h2>
              <button
                onClick={() => setViewAll(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid gap-4">
                {getViewAllTasks().map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;