import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  Timestamp,
  onSnapshot,
  or,
  and,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useChannels } from './ChannelContext';

export interface DirectMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  createdAt: Date;
}

interface DirectMessageContextProps {
  messages: DirectMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  getMessagesWithUser: (userId: string) => Promise<DirectMessage[]>;
  canMessageUser: (userId: string) => Promise<boolean>;
}

const DirectMessageContext = createContext<DirectMessageContextProps | null>(null);

export const useDirectMessages = () => {
  const context = useContext(DirectMessageContext);
  if (!context) {
    throw new Error('useDirectMessages must be used within a DirectMessageProvider');
  }
  return context;
};

export const DirectMessageProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { joinedChannels } = useChannels();

  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query messages where the current user is either sender or receiver
    const q = query(
      collection(db, 'directMessages'),
      or(
        where('senderId', '==', currentUser.uid),
        where('receiverId', '==', currentUser.uid)
      ),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesList: DirectMessage[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content,
            senderId: data.senderId,
            receiverId: data.receiverId,
            senderName: data.senderName,
            createdAt: data.createdAt.toDate()
          };
        });
        
        setMessages(messagesList);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Check if two users share any channels
  const canMessageUser = async (userId: string): Promise<boolean> => {
    if (!currentUser) return false;

    // Get all channels where both users are members
    const sharedChannels = joinedChannels.filter(channel => 
      channel.members.includes(userId) && channel.members.includes(currentUser.uid)
    );

    return sharedChannels.length > 0;
  };

  const sendMessage = async (receiverId: string, content: string) => {
    try {
      if (!currentUser) throw new Error('You must be logged in to send messages');
      
      // Check if users share a channel before allowing message
      const canMessage = await canMessageUser(receiverId);
      if (!canMessage) {
        throw new Error('You can only message users who are in the same channels as you');
      }
      
      setError(null);
      const messageData = {
        content,
        senderId: currentUser.uid,
        receiverId,
        senderName: currentUser.displayName || 'Anonymous',
        createdAt: Timestamp.fromDate(new Date())
      };
      
      await addDoc(collection(db, 'directMessages'), messageData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getMessagesWithUser = async (userId: string): Promise<DirectMessage[]> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to view messages');
      
      // Check if users share a channel before showing messages
      const canMessage = await canMessageUser(userId);
      if (!canMessage) {
        throw new Error('You can only view messages with users who are in the same channels as you');
      }
      
      setError(null);
      setLoading(true);
      
      const q = query(
        collection(db, 'directMessages'),
        and(
          or(
            where('senderId', '==', currentUser.uid),
            where('receiverId', '==', currentUser.uid)
          ),
          or(
            where('senderId', '==', userId),
            where('receiverId', '==', userId)
          )
        ),
        orderBy('createdAt', 'asc')
      );
      
      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const messagesList: DirectMessage[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                content: data.content,
                senderId: data.senderId,
                receiverId: data.receiverId,
                senderName: data.senderName,
                createdAt: data.createdAt.toDate()
              };
            });
            
            setMessages(messagesList);
            setLoading(false);
            resolve(messagesList);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
            reject(err);
          }
        );
        
        return () => unsubscribe();
      });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const value = {
    messages,
    loading,
    error,
    sendMessage,
    getMessagesWithUser,
    canMessageUser
  };

  return <DirectMessageContext.Provider value={value}>{children}</DirectMessageContext.Provider>;
};