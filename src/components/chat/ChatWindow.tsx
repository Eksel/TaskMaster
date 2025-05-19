import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useChannels } from '../../contexts/ChannelContext';
import { auth } from '../../firebase/config';
import ChatMessage from './ChatMessage';
import type { Unsubscribe } from 'firebase/firestore';

interface ChatWindowProps {
  channelId: string;
}

const ChatWindow = ({ channelId }: ChatWindowProps) => {
  const { messages, sendMessage, getChannelMessages, loading } = useChat();
  const { channels } = useChannels();
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(messages.length);

  // Check if user has permission to send messages
  const canSendMessages = () => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel || !auth.currentUser) return false;
    
    return (
      channel.createdBy === auth.currentUser.uid ||
      channel.admins.includes(auth.currentUser.uid) ||
      channel.members.includes(auth.currentUser.uid)
    );
  };

  useEffect(() => {
    const setupMessages = async () => {
      try {
        // Clean up previous subscription if it exists
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        
        // Set up new subscription
        const unsubscribe = await getChannelMessages(channelId);
        unsubscribeRef.current = unsubscribe;
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error setting up messages:', error);
        setIsInitialLoad(false);
      }
    };

    setupMessages();

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [channelId, getChannelMessages]);

  useEffect(() => {
    if (loading || !messagesContainerRef.current) return;

    const hasNewMessages = messages.length > previousMessagesLengthRef.current;
    const isUserMessage = hasNewMessages && messages[messages.length - 1]?.senderId === auth.currentUser?.uid;

    if (isInitialLoad || hasNewMessages || isUserMessage) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isInitialLoad ? 'auto' : 'smooth'
      });
    }

    previousMessagesLengthRef.current = messages.length;
  }, [messages, loading, isInitialLoad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Clear any previous errors
    setError(null);

    // Check permissions before attempting to send
    if (!canSendMessages()) {
      setError('You do not have permission to send messages in this channel');
      return;
    }

    try {
      await sendMessage(channelId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-white rounded-lg shadow-sm">
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
        {error && (
          <div className="mb-2 p-2 bg-red-50 text-red-600 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="form-input flex-1"
            disabled={!canSendMessages()}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !canSendMessages()}
            className="btn btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {!canSendMessages() && (
          <p className="mt-2 text-sm text-gray-500">
            You must be a member of this channel to send messages
          </p>
        )}
      </form>
    </div>
  );
};

export default ChatWindow;