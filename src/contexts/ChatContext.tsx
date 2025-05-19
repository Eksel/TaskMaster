import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  onSnapshot,
  Timestamp,
  limit,
  FirestoreError,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
  channelId: string;
}

interface ChatContextProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (channelId: string, content: string) => Promise<void>;
  getChannelMessages: (channelId: string) => Promise<() => void>;
}

const ChatContext = createContext<ChatContextProps | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      setLoading(false);
    }
  }, [currentUser]);

  const sendMessage = async (channelId: string, content: string) => {
    try {
      if (!currentUser) throw new Error('You must be logged in to send messages');
      
      setError(null);
      const messageData = {
        content,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        createdAt: Timestamp.fromDate(new Date()),
        channelId
      };
      
      // Ensure we're using the correct collection path
      const messagesRef = collection(db, `channels/${channelId}/messages`);
      await addDoc(messagesRef, messageData);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message);
      throw err;
    }
  };

  const getChannelMessages = async (channelId: string): Promise<() => void> => {
    try {
      if (!currentUser) throw new Error('You must be logged in to view messages');
      
      setError(null);
      setLoading(true);
      
      // Ensure we're using the correct collection path
      const channelRef = doc(db, 'channels', channelId);
      const messagesRef = collection(channelRef, 'messages');
      const q = query(
        messagesRef,
        orderBy('createdAt', 'asc'),
        limit(100)
      );
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messagesList: Message[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            content: doc.data().content,
            senderId: doc.data().senderId,
            senderName: doc.data().senderName,
            createdAt: doc.data().createdAt.toDate(),
            channelId: doc.data().channelId
          }));
          
          setMessages(messagesList);
          setLoading(false);
        },
        (err: FirestoreError) => {
          console.error('Error fetching messages:', err);
          setError('Failed to load messages. Please try again later.');
          setLoading(false);
        }
      );
      
      return unsubscribe;
    } catch (err: any) {
      console.error('Error in getChannelMessages:', err);
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
    getChannelMessages
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};