import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useChannels } from '../../contexts/ChannelContext';
import { useTasks } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ChatWindow from '../../components/chat/ChatWindow';
import TaskList from '../../components/tasks/TaskList';
import {
  Users,
  Settings,
  Plus,
  X,
  Crown,
  Shield,
  UserMinus,
  UserPlus,
  Copy,
  AlertCircle,
  Lock,
  MessageSquare,
  ListTodo
} from 'lucide-react';
import type { Task } from '../../contexts/TaskContext';

type TabType = 'chat' | 'tasks';

interface ChannelMember {
  id: string;
  displayName: string;
  email: string;
}

const ChannelDetails = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const {
    getChannelById,
    deleteChannel,
    generateInviteCode,
    promoteToAdmin,
    demoteFromAdmin,
    removeMemberFromChannel,
  } = useChannels();
  const { getTasksByChannel, addTask, toggleTaskCompletion, deleteTask, toggleShoppingItem, updateTask } = useTasks();

  // Initialize activeTab from location state if available
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const state = location.state as { activeTab?: TabType };
    return state?.activeTab || 'chat';
  });
  const [channel, setChannel] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [hasFetchedMembers, setHasFetchedMembers] = useState(false);

  // Update activeTab when location state changes
  useEffect(() => {
    const state = location.state as { activeTab?: TabType };
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  // Prevent body scroll when modals are open
  const toggleModal = (modalState: boolean, setter: (state: boolean) => void) => {
    if (modalState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    setter(modalState);
  };

  // Fetch member details
  const fetchMemberDetails = async (memberIds: string[]) => {
    if (!memberIds?.length) return;
    
    setLoadingMembers(true);
    setError('');
    
    try {
      const memberDetails = await Promise.all(
        memberIds.map(async (memberId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            if (userDoc.exists()) {
              return {
                id: userDoc.id,
                ...userDoc.data()
              } as ChannelMember;
            }
          } catch (err) {
            console.error(`Error fetching user ${memberId}:`, err);
          }
          return {
            id: memberId,
            displayName: 'Unknown User',
            email: ''
          };
        })
      );
      setChannelMembers(memberDetails);
      setHasFetchedMembers(true);
    } catch (error) {
      console.error('Error fetching member details:', error);
      setError('Failed to load member details');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch member details when modal is opened
  useEffect(() => {
    if (showMembers && channel?.members && !hasFetchedMembers) {
      fetchMemberDetails(channel.members);
    }
  }, [showMembers, channel?.members, hasFetchedMembers]);

  useEffect(() => {
    const loadChannelData = async () => {
      try {
        if (!channelId) return;

        const channelData = await getChannelById(channelId);
        if (!channelData) {
          navigate('/channels');
          return;
        }

        setChannel(channelData);
        const channelTasks = await getTasksByChannel(channelId);
        setTasks(channelTasks);
      } catch (error) {
        console.error('Error loading channel:', error);
        setError('Failed to load channel data');
      } finally {
        setLoading(false);
      }
    };

    loadChannelData();
  }, [channelId, getChannelById, getTasksByChannel, navigate]);

  // Reset members state when modal is closed
  useEffect(() => {
    if (!showMembers) {
      setHasFetchedMembers(false);
      setChannelMembers([]);
    }
  }, [showMembers]);

  const handleDeleteChannel = async () => {
    try {
      if (!channelId) return;
      await deleteChannel(channelId);
      navigate('/channels');
    } catch (error) {
      console.error('Error deleting channel:', error);
      setError('Failed to delete channel');
    }
  };

  const handleGenerateInviteCode = async () => {
    try {
      if (!channelId) return;
      const code = await generateInviteCode(channelId);
      setInviteCode(code);
    } catch (error) {
      console.error('Error generating invite code:', error);
      setError('Failed to generate invite code');
    }
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setError('Failed to copy invite code');
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      if (!channelId) return;
      await promoteToAdmin(channelId, userId);
      const updatedChannel = await getChannelById(channelId);
      setChannel(updatedChannel);
      await fetchMemberDetails(updatedChannel.members);
    } catch (error) {
      console.error('Error promoting user:', error);
      setError('Failed to promote user to admin');
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    try {
      if (!channelId) return;
      await demoteFromAdmin(channelId, userId);
      const updatedChannel = await getChannelById(channelId);
      setChannel(updatedChannel);
      await fetchMemberDetails(updatedChannel.members);
    } catch (error) {
      console.error('Error demoting user:', error);
      setError('Failed to demote user from admin');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      if (!channelId) return;
      await removeMemberFromChannel(channelId, userId);
      const updatedChannel = await getChannelById(channelId);
      setChannel(updatedChannel);
      await fetchMemberDetails(updatedChannel.members);
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const handleAddTask = async (taskInput: {
    title: string;
    description?: string;
    dueDate?: Date;
    dueTime?: string;
    priority: 'low' | 'medium' | 'high';
  }) => {
    try {
      if (!channelId) return;
      await addTask({ ...taskInput, channelId });
      const updatedTasks = await getTasksByChannel(channelId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task');
    }
  };

  const handleToggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      if (!channelId) return;
      await toggleTaskCompletion(taskId, completed, channelId);
      const updatedTasks = await getTasksByChannel(channelId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (!channelId) return;
      await deleteTask(taskId, channelId);
      const updatedTasks = await getTasksByChannel(channelId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleToggleShoppingItem = async (taskId: string, itemId: string, completed: boolean) => {
    try {
      if (!channelId) return;
      await toggleShoppingItem(taskId, itemId, completed, channelId);
      const updatedTasks = await getTasksByChannel(channelId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error toggling shopping item:', error);
      setError('Failed to update shopping item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Channel not found</p>
      </div>
    );
  }

  const isCreator = currentUser?.uid === channel.createdBy;
  const isAdmin = channel.admins.includes(currentUser?.uid);
  const isMember = channel.members.includes(currentUser?.uid);

  const canDeleteTask = (task: Task) => {
    return isCreator || isAdmin || task.createdBy === currentUser?.uid || isMember;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">#{channel.name}</h1>
          {!channel.isPublic && <Lock className="h-5 w-5 text-gray-500" />}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleModal(true, setShowMembers)}
            className="btn btn-outline flex items-center"
          >
            <Users className="h-5 w-5 mr-2" />
            Members
          </button>

          {(isCreator || isAdmin) && (
            <button
              onClick={() => toggleModal(true, setShowSettings)}
              className="btn btn-outline flex items-center"
            >
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-error-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('chat')}
            className={`
              flex items-center px-1 py-4 border-b-2 font-medium text-sm
              ${activeTab === 'chat'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`
              flex items-center px-1 py-4 border-b-2 font-medium text-sm
              ${activeTab === 'tasks'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <ListTodo className="h-5 w-5 mr-2" />
            Tasks
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'chat' ? (
          <ChatWindow channelId={channelId!} />
        ) : (
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleTaskCompletion}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleAddTask}
            onToggleShoppingItem={toggleShoppingItem}
            canAddTasks={isCreator || isAdmin || isMember}
            canDeleteTask={canDeleteTask}
            channelId={channelId}
            updateTask={updateTask}
          />
        )}
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Channel Members</h2>
              <button
                onClick={() => toggleModal(false, setShowMembers)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {channelMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {member.displayName?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.displayName || 'Unknown User'}</p>
                        {member.email && (
                          <p className="text-sm text-gray-500">{member.email}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {channel.createdBy === member.id && (
                            <span className="badge badge-high flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Creator
                            </span>
                          )}
                          {channel.admins.includes(member.id) && (
                            <span className="badge badge-medium flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isCreator && member.id !== channel.createdBy && (
                      <div className="flex items-center gap-2">
                        {channel.admins.includes(member.id) ? (
                          <button
                            onClick={() => handleDemoteFromAdmin(member.id)}
                            className="btn btn-outline p-2"
                            title="Demote from admin"
                          >
                            <UserMinus className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromoteToAdmin(member.id)}
                            className="btn btn-outline p-2"
                            title="Promote to admin"
                          >
                            <UserPlus className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="btn btn-error p-2"
                          title="Remove member"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6">Channel Settings</h2>

            {!channel.isPublic && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteCode || channel.inviteCode || ''}
                    readOnly
                    className="form-input flex-1"
                  />
                  <button
                    onClick={handleGenerateInviteCode}
                    className="btn btn-outline p-2"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleCopyInviteCode}
                    className="btn btn-outline p-2"
                    disabled={!inviteCode && !channel.inviteCode}
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-sm text-success-600 mt-1">
                    Copied to clipboard!
                  </p>
                )}
              </div>
            )}

            {isCreator && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Danger Zone
                </h3>
                <button
                  onClick={handleDeleteChannel}
                  className="btn bg-red-300 btn-error w-full"
                >
                  Delete Channel
                </button>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => toggleModal(false, setShowSettings)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelDetails;