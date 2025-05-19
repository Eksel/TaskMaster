import { useState, useEffect } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { useChannels } from '../../contexts/ChannelContext';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Users, X } from 'lucide-react';
import TaskDetailsModal from '../../components/ui/TaskDetailsModal';
import type { Task } from '../../contexts/TaskContext';

interface ChannelTask extends Task {
  channelName?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = () => {
  const { tasks, getTasksByChannel } = useTasks();
  const { joinedChannels } = useChannels();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<ChannelTask | null>(null);
  const [channelTasks, setChannelTasks] = useState<ChannelTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  // Get the calendar grid including days from previous/next months
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(start),
    end: endOfWeek(end)
  });

  useEffect(() => {
    const fetchChannelTasks = async () => {
      try {
        const allChannelTasks: ChannelTask[] = [];
        
        for (const channel of joinedChannels) {
          const channelTasksList = await getTasksByChannel(channel.id);
          const tasksWithChannel = channelTasksList.map(task => ({
            ...task,
            channelName: channel.name
          }));
          allChannelTasks.push(...tasksWithChannel);
        }
        
        setChannelTasks(allChannelTasks);
      } catch (error) {
        console.error('Error fetching channel tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannelTasks();
  }, [joinedChannels, getTasksByChannel]);

  const getTasksForDate = (date: Date) => {
    const personalTasks = tasks.filter(task => 
      task.dueDate && isSameDay(task.dueDate, date)
    );
    
    const channelTasksForDate = channelTasks.filter(task =>
      task.dueDate && isSameDay(task.dueDate, date)
    );
    
    return [...personalTasks, ...channelTasksForDate];
  };

  const previousMonth = () => {
    setCurrentDate(date => subMonths(date, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(date => addMonths(date, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetails(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-lg">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`min-h-[5rem] sm:min-h-[8rem] p-2 border-r border-b relative transition-colors
                  ${isToday(day) ? 'bg-primary-50' : isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isSelected ? 'ring-2 ring-primary-500 ring-inset' : ''}
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                  hover:bg-gray-50
                `}
              >
                <div className={`font-medium text-sm mb-1 ${
                  isToday(day) ? 'text-primary-600' : ''
                }`}>
                  {format(day, 'd')}
                </div>
                
                {dayTasks.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dayTasks.slice(0, 3).map((task, index) => (
                      <div
                        key={task.id}
                        className={`w-2 h-2 rounded-full ${
                          task.completed
                            ? 'bg-gray-300'
                            : task.priority === 'high'
                            ? 'bg-error-500'
                            : task.priority === 'medium'
                            ? 'bg-warning-500'
                            : 'bg-primary-500'
                        }`}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{dayTasks.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal */}
      {showDayDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              <button
                onClick={() => {
                  setShowDayDetails(false);
                  setSelectedDate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {getTasksForDate(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getTasksForDate(selectedDate).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task as ChannelTask)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        task.completed
                          ? 'bg-gray-50 text-gray-500'
                          : task.priority === 'high'
                          ? 'bg-error-50 hover:bg-error-100'
                          : task.priority === 'medium'
                          ? 'bg-warning-50 hover:bg-warning-100'
                          : 'bg-primary-50 hover:bg-primary-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{task.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-white">
                          {task.priority}
                        </span>
                      </div>
                      {task.dueTime && (
                        <div className="flex items-center gap-1 mt-1 text-sm opacity-75">
                          <Clock className="h-3 w-3" />
                          <span>{task.dueTime}</span>
                        </div>
                      )}
                      {(task as ChannelTask).channelName && (
                        <div className="flex items-center gap-1 mt-1 text-sm opacity-75">
                          <Users className="h-3 w-3" />
                          <span>#{(task as ChannelTask).channelName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No tasks for this day
                </p>
              )}
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

export default CalendarView;