import { useState } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { Filter, Search, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import TaskList from '../../components/tasks/TaskList';
import 'react-day-picker/dist/style.css';

const TodoView = () => {
  const { tasks, addTask, toggleTaskCompletion, deleteTask, toggleShoppingItem, updateTask } = useTasks();
  const { currentUser } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter personal tasks that belong to the current user
  const personalTasks = tasks.filter(task => 
    !task.channelId && 
    task.createdBy === currentUser?.uid
  );

  const filteredTasks = personalTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && task.completed) ||
      (statusFilter === 'active' && !task.completed);

    const matchesDate =
      !selectedDate ||
      (task.dueDate &&
        task.dueDate.getDate() === selectedDate.getDate() &&
        task.dueDate.getMonth() === selectedDate.getMonth() &&
        task.dueDate.getFullYear() === selectedDate.getFullYear());

    return matchesSearch && matchesPriority && matchesStatus && matchesDate;
  });

  const clearFilters = () => {
    setPriorityFilter('all');
    setStatusFilter('all');
    setSelectedDate(undefined);
  };

  const hasActiveFilters = priorityFilter !== 'all' || statusFilter !== 'all' || selectedDate !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Personal Tasks</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="form-input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className={`btn ${hasActiveFilters ? 'btn-primary' : 'btn-outline'} flex items-center whitespace-nowrap`}
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-sm">
              {[
                priorityFilter !== 'all' && 'Priority',
                statusFilter !== 'all' && 'Status',
                selectedDate && 'Date'
              ].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Filter Tasks</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <label className="form-label">Priority</label>
                <select
                  className="form-input w-full"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-input w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="form-label">Due Date</label>
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="border rounded-lg p-3 mx-auto"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn btn-outline"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="btn btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {priorityFilter !== 'all' && (
            <span className="badge badge-medium">
              Priority: {priorityFilter}
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="badge badge-medium">
              Status: {statusFilter}
            </span>
          )}
          {selectedDate && (
            <span className="badge badge-medium">
              Date: {selectedDate.toLocaleDateString()}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Task List */}
      <TaskList
        tasks={filteredTasks}
        onToggleComplete={toggleTaskCompletion}
        onDeleteTask={deleteTask}
        onAddTask={addTask}
        onToggleShoppingItem={toggleShoppingItem}
        canAddTasks={true}
        canDeleteTask={() => true}
        updateTask={updateTask}
      />
    </div>
  );
};

export default TodoView;