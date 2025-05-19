import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useDirectMessages } from '../../contexts/DirectMessageContext';
import { useAuth } from '../../contexts/AuthContext';
import ChatMessage from './ChatMessage';

interface DirectMessageWindowProps {
  userId: string;
  userName: string;
}

const DirectMessageWindow = ({ userId, userName }: DirectMessageWindowProps) => {
  const { messages, sendMessage, getMessagesWithUser, loading } = useDirectMessages();
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        await getMessagesWithUser(userId);
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [userId]);

  useEffect(() => {
    if (loading || !messagesContainerRef.current) return;

    const hasNewMessages = messages.length > previousMessagesLengthRef.current;
    const isUserMessage = hasNewMessages && messages[messages.length - 1]?.senderId === currentUser?.uid;

    if (isInitialLoad || hasNewMessages || isUserMessage) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isInitialLoad ? 'auto' : 'smooth'
      });
    }

    previousMessagesLengthRef.current = messages.length;
  }, [messages, loading, isInitialLoad, currentUser?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(userId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chat with {userName}</h2>
      </div>
      
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 scroll-smooth"
      >
        {loading && isInitialLoad ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="form-input flex-1"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn btn-primary p-2"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default DirectMessageWindow;