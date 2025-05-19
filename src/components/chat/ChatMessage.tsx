import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import type { Message } from '../../contexts/ChatContext';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const { currentUser } = useAuth();
  const isOwnMessage = message.senderId === currentUser?.uid;

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[70%] ${
          isOwnMessage
            ? 'bg-primary-500 text-white rounded-l-lg rounded-tr-lg'
            : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
        } px-4 py-2 shadow-sm`}
      >
        {!isOwnMessage && (
          <div className="text-sm font-medium text-gray-600 mb-1">
            {message.senderName}
          </div>
        )}
        <p className="text-sm">{message.content}</p>
        <div
          className={`text-xs mt-1 ${
            isOwnMessage ? 'text-primary-100' : 'text-gray-500'
          }`}
        >
          {format(message.createdAt, 'HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;