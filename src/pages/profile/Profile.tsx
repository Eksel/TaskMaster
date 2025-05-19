import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Camera } from 'lucide-react';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await updateUserProfile(displayName);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-elevation-1 rounded-lg overflow-hidden">
        <div className="bg-primary-500 h-32 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-full bg-white p-1">
              <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center relative group">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Profile'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-500" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
              <p className="text-error-700 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-md">
              <p className="text-success-700 text-sm">{success}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="form-label">Display Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="displayName"
                  type="text"
                  className="form-input pl-10"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="form-input pl-10"
                  value={currentUser?.email || ''}
                  disabled
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Email cannot be changed
              </p>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;