import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useDirectMessages } from '../contexts/DirectMessageContext';
import { useChannels } from '../contexts/ChannelContext';
import { Search, MessageSquare, ArrowLeft, AlertCircle, Users, User } from 'lucide-react';
import DirectMessageWindow from '../components/chat/DirectMessageWindow';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  displayName: string;
  email: string;
  canMessage?: boolean;
}

const DirectMessages = () => {
  const { currentUser } = useAuth();
  const { canMessageUser } = useDirectMessages();
  const { joinedChannels } = useChannels();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUsersList, setShowUsersList] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get all users who share channels with the current user
        const sharedUserIds = new Set<string>();
        joinedChannels.forEach(channel => {
          channel.members.forEach(memberId => {
            if (memberId !== currentUser?.uid) {
              sharedUserIds.add(memberId);
            }
          });
        });

        // Only fetch users who share channels
        const usersRef = collection(db, 'users');
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        const usersList = await Promise.all(
          querySnapshot.docs
            .filter(doc => sharedUserIds.has(doc.id))
            .map(async doc => {
              const userData = {
                id: doc.id,
                ...doc.data()
              } as User;

              // Check if user can be messaged
              const canMessage = await canMessageUser(doc.id);
              return {
                ...userData,
                canMessage
              };
            })
        );
        
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, canMessageUser, joinedChannels]);

  const filteredUsers = users.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    if (!user.canMessage) {
      setError('You can only message users who are in the same channels as you');
      return;
    }
    setSelectedUser(user);
    setShowUsersList(false);
    setError(null);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Users Sidebar */}
      <div 
        className={`
          w-full md:w-80 bg-white border-r border-gray-200 flex flex-col
          ${showUsersList ? 'block' : 'hidden md:block'}
        `}
      >
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {error && (
                <div className="mx-2 mb-4 p-3 bg-error-50 border border-error-200 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-error-700 text-sm">{error}</p>
                </div>
              )}
              
              {filteredUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleUserSelect(user)}
                    className={`flex-1 p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {user.displayName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </button>
                  <Link
                    to={`/user/${user.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="View Profile"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  {searchTerm ? 'No users found' : 'No users in your channels'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className={`
          flex-1 
          ${!showUsersList ? 'block' : 'hidden md:block'}
        `}
      >
        {selectedUser ? (
          <div className="h-full flex flex-col">
            <div className="p-4 bg-white border-b md:hidden">
              <button
                onClick={() => setShowUsersList(true)}
                className="flex items-center text-gray-600"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to users
              </button>
            </div>
            <div className="flex-1">
              <DirectMessageWindow
                userId={selectedUser.id}
                userName={selectedUser.displayName}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p>Select a user to start chatting</p>
              <p className="text-sm mt-2">You can only message users who are in the same channels as you</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;