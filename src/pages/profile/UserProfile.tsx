import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useTasks } from '../../contexts/TaskContext';
import { User, Mail, Globe } from 'lucide-react';
import TaskList from '../../components/tasks/TaskList';

interface UserData {
  displayName: string;
  email: string;
  photoURL: string | null;
}

const UserProfile = () => {
  const { userId } = useParams();
  const { tasks } = useTasks();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) return;
        
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setError('User not found');
          return;
        }
        
        setUserData(userDoc.data() as UserData);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Filter public tasks for this user
  const publicTasks = tasks.filter(task => 
    task.createdBy === userId && 
    task.privacy === 'public' &&
    !task.channelId // Only personal tasks, not channel tasks
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="text-center py-8 text-gray-500">
        {error || 'User not found'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-elevation-1 rounded-lg overflow-hidden">
        <div className="bg-primary-500 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center">
                {userData.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt={userData.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {userData.displayName}
            </h1>
            <div className="flex items-center text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {userData.email}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Public Tasks</h2>
              <Globe className="h-5 w-5 text-gray-400" />
            </div>

            <TaskList
              tasks={publicTasks}
              onToggleComplete={() => {}}
              onDeleteTask={() => {}}
              onAddTask={() => Promise.resolve('')}
              canAddTasks={false}
              canDeleteTask={() => false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;