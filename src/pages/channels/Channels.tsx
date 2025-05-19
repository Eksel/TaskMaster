import { useState } from 'react';
import { useChannels } from '../../contexts/ChannelContext';
import { Plus, Search, Users, Lock, Globe, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Channels = () => {
  const { publicChannels, createChannel, joinChannel, joinChannelByInviteCode } = useChannels();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  
  const [newChannel, setNewChannel] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  // Prevent body scroll when modals are open
  const toggleModal = (modalState: boolean, setter: (state: boolean) => void) => {
    if (modalState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    setter(modalState);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await createChannel(newChannel);
      toggleModal(false, setShowCreateChannel);
      setNewChannel({ name: '', description: '', isPublic: true });
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleJoinPrivate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await joinChannelByInviteCode(inviteCode);
      toggleModal(false, setShowJoinPrivate);
      setInviteCode('');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    try {
      setError('');
      setJoinLoading(channelId);
      await joinChannel(channelId);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setJoinLoading(null);
    }
  };

  const filteredChannels = publicChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
        <div className="flex gap-2">
          <button
            onClick={() => toggleModal(true, setShowJoinPrivate)}
            className="btn btn-outline flex items-center"
          >
            <Lock className="h-5 w-5 mr-2" />
            Join Private
          </button>
          <button
            onClick={() => toggleModal(true, setShowCreateChannel)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Channel
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-error-700">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search public channels..."
          className="form-input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Public Channels List */}
      <div className="grid gap-4">
        {filteredChannels.map(channel => (
          <div
            key={channel.id}
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{channel.name}</h3>
                <span className="badge badge-low flex items-center">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </span>
              </div>
              {channel.description && (
                <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {channel.members.length} member{channel.members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => handleJoinChannel(channel.id)}
              disabled={joinLoading === channel.id}
              className="btn btn-outline flex items-center"
            >
              {joinLoading === channel.id ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
              ) : (
                <>
                  <Users className="h-5 w-5 mr-2" />
                  Join
                </>
              )}
            </button>
          </div>
        ))}
        
        {filteredChannels.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No public channels found
          </p>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Channel</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
                <p className="text-error-700 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="form-label">Channel Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={newChannel.description}
                  onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="form-label">Visibility</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={newChannel.isPublic}
                      onChange={() => setNewChannel({ ...newChannel, isPublic: true })}
                      className="mr-2"
                    />
                    <Globe className="h-4 w-4 mr-2" />
                    Public Channel
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!newChannel.isPublic}
                      onChange={() => setNewChannel({ ...newChannel, isPublic: false })}
                      className="mr-2"
                    />
                    <Lock className="h-4 w-4 mr-2" />
                    Private Channel
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => toggleModal(false, setShowCreateChannel)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Private Channel Modal */}
      {showJoinPrivate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Join Private Channel</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
                <p className="text-error-700 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleJoinPrivate} className="space-y-4">
              <div>
                <label className="form-label">Invite Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => toggleModal(false, setShowJoinPrivate)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Join Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channels;