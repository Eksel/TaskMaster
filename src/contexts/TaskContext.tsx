import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  onSnapshot,
  or,
  and,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useChannels } from './ChannelContext';

export interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
  quantity?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  channelId?: string;
  createdBy: string;
  createdAt: Date;
  type?: 'regular' | 'shopping';
  status: 'not_started' | 'in_progress' | 'completed';
  shoppingItems?: ShoppingItem[];
  privacy: 'public' | 'private';
}

interface TaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  channelId?: string;
  type?: 'regular' | 'shopping';
  shoppingItems?: Omit<ShoppingItem, 'id'>[];
  privacy?: 'public' | 'private';
}

interface TaskContextProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (task: TaskInput) => Promise<string>;
  updateTask: (id: string, updates: Partial<TaskInput>) => Promise<void>;
  deleteTask: (id: string, channelId?: string) => Promise<void>;
  toggleTaskCompletion: (id: string, completed: boolean, channelId?: string) => Promise<void>;
  toggleShoppingItem: (taskId: string, itemId: string, completed: boolean, channelId?: string) => Promise<void>;
  getTasksByChannel: (channelId: string) => Promise<Task[]>;
}

const TaskContext = createContext<TaskContextProps | null>(null);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { joinedChannels } = useChannels();

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query personal tasks and public tasks
    const personalTasksQuery = query(
      collection(db, 'tasks'),
      or(
        where('createdBy', '==', currentUser.uid),
        where('privacy', '==', 'public')
      ),
      orderBy('createdAt', 'desc')
    );

    // Query tasks from all channels the user is a member of
    const channelTasksQueries = joinedChannels.map(channel => 
      query(
        collection(db, `channels/${channel.id}/tasks`),
        orderBy('createdAt', 'desc')
      )
    );

    const unsubscribeCallbacks: (() => void)[] = [];

    // Subscribe to personal and public tasks
    const unsubscribePersonal = onSnapshot(
      personalTasksQuery,
      (snapshot) => {
        const personalTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : undefined,
          privacy: doc.data().privacy || 'private',
          status: doc.data().status || (doc.data().completed ? 'completed' : 'not_started')
        })) as Task[];
        
        setTasks(prev => {
          const channelTasks = prev.filter(task => task.channelId);
          return [...personalTasks, ...channelTasks];
        });
      },
      (error) => {
        console.error('Error fetching personal tasks:', error);
        setError('Failed to fetch tasks');
      }
    );

    unsubscribeCallbacks.push(unsubscribePersonal);

    // Subscribe to each channel's tasks
    channelTasksQueries.forEach((channelQuery, index) => {
      const unsubscribeChannel = onSnapshot(
        channelQuery,
        (snapshot) => {
          const channelTasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            channelId: joinedChannels[index].id,
            createdAt: doc.data().createdAt.toDate(),
            dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : undefined,
            privacy: doc.data().privacy || 'private',
            status: doc.data().status || (doc.data().completed ? 'completed' : 'not_started')
          })) as Task[];

          setTasks(prev => {
            const otherChannelTasks = prev.filter(task => 
              task.channelId && task.channelId !== joinedChannels[index].id
            );
            const personalTasks = prev.filter(task => !task.channelId);
            return [...personalTasks, ...otherChannelTasks, ...channelTasks];
          });
        },
        (error) => {
          console.error(`Error fetching tasks for channel ${joinedChannels[index].id}:`, error);
        }
      );

      unsubscribeCallbacks.push(unsubscribeChannel);
    });

    setLoading(false);

    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, joinedChannels]);

  const addTask = async (taskInput: TaskInput): Promise<string> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to add a task');
      
      setError(null);
      const taskData: any = {
        ...taskInput,
        completed: false,
        createdBy: currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        dueDate: taskInput.dueDate ? Timestamp.fromDate(taskInput.dueDate) : null,
        dueTime: taskInput.dueTime || null,
        type: taskInput.type || 'regular',
        privacy: taskInput.privacy || 'private',
        status: 'not_started',
        shoppingItems: taskInput.shoppingItems?.map(item => ({
          ...item,
          id: crypto.randomUUID(),
          completed: false
        }))
      };
      
      let docRef;
      if (taskInput.channelId) {
        docRef = await addDoc(collection(db, `channels/${taskInput.channelId}/tasks`), taskData);
      } else {
        docRef = await addDoc(collection(db, 'tasks'), taskData);
      }
      return docRef.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<TaskInput>): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to update a task');
      
      setError(null);
      const updatedData: any = { ...updates };
      
      if (updates.dueDate) {
        updatedData.dueDate = Timestamp.fromDate(updates.dueDate);
      }

      if (updates.shoppingItems) {
        updatedData.shoppingItems = updates.shoppingItems.map(item => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          completed: item.completed || false
        }));
      }
      
      if (updates.channelId) {
        const taskRef = doc(db, `channels/${updates.channelId}/tasks`, id);
        await updateDoc(taskRef, updatedData);
      } else {
        const taskRef = doc(db, 'tasks', id);
        await updateDoc(taskRef, updatedData);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (id: string, channelId?: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to delete a task');
      
      setError(null);
      
      const taskRef = channelId
        ? doc(db, `channels/${channelId}/tasks`, id)
        : doc(db, 'tasks', id);
        
      await deleteDoc(taskRef);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const toggleTaskCompletion = async (id: string, completed: boolean, channelId?: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to update a task');
      
      setError(null);
      const taskRef = channelId 
        ? doc(db, `channels/${channelId}/tasks`, id)
        : doc(db, 'tasks', id);
      
      // Get the current task data
      const task = tasks.find(t => t.id === id);
      
      if (task?.type === 'shopping' && task.shoppingItems) {
        // Update all shopping items to match the task completion status
        const updatedItems = task.shoppingItems.map(item => ({
          ...item,
          completed: completed
        }));
        
        // Update both the task completion and all shopping items
        await updateDoc(taskRef, {
          completed,
          status: completed ? 'completed' : 'not_started',
          shoppingItems: updatedItems
        });
      } else {
        // For regular tasks, update the completion status and status field
        await updateDoc(taskRef, { 
          completed,
          status: completed ? 'completed' : task?.status === 'in_progress' ? 'in_progress' : 'not_started'
        });
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const toggleShoppingItem = async (taskId: string, itemId: string, completed: boolean, channelId?: string): Promise<void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to update a task');
      
      setError(null);
      const taskRef = channelId 
        ? doc(db, `channels/${channelId}/tasks`, taskId)
        : doc(db, 'tasks', taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.shoppingItems) throw new Error('Task or shopping items not found');
      
      const updatedItems = task.shoppingItems.map(item => 
        item.id === itemId ? { ...item, completed } : item
      );
      
      // Calculate new status based on items completion
      const allCompleted = updatedItems.every(item => item.completed);
      const anyCompleted = updatedItems.some(item => item.completed);
      const newStatus = allCompleted ? 'completed' : anyCompleted ? 'in_progress' : 'not_started';
      
      await updateDoc(taskRef, {
        shoppingItems: updatedItems,
        status: newStatus,
        completed: allCompleted
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getTasksByChannel = async (channelId: string): Promise<Task[]> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to view tasks');
      
      setError(null);
      setLoading(true);
      
      const q = query(
        collection(db, `channels/${channelId}/tasks`),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const channelTasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : undefined,
        status: doc.data().status || (doc.data().completed ? 'completed' : 'not_started')
      })) as Task[];
      
      return channelTasks;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    toggleShoppingItem,
    getTasksByChannel
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};