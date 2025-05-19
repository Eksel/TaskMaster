import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  Users, 
  MessageSquare,
  PlusCircle, 
  ChevronDown, 
  ChevronRight,
  X 
} from 'lucide-react';
import { useChannels } from '../../contexts/ChannelContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  const { joinedChannels } = useChannels();
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 md:hidden">
            <h2 className="font-semibold text-gray-900">Menu</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                end
                onClick={onClose}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </NavLink>

              <NavLink
                to="/todo"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                onClick={onClose}
              >
                <CheckSquare className="mr-3 h-5 w-5" />
                Personal Tasks
              </NavLink>

              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                onClick={onClose}
              >
                <Calendar className="mr-3 h-5 w-5" />
                Calendar
              </NavLink>

              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                onClick={onClose}
              >
                <Users className="mr-3 h-5 w-5" />
                Users
              </NavLink>
              
              <div className="pt-4">
                <button
                  onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <div className="flex items-center">
                    <Users className="mr-3 h-5 w-5" />
                    <span>Channels</span>
                  </div>
                  {isChannelsExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {isChannelsExpanded && (
                  <div className="mt-1 pl-10 space-y-1">
                    {joinedChannels.map((channel) => (
                      <NavLink
                        key={channel.id}
                        to={`/channels/${channel.id}`}
                        className={({ isActive }) =>
                          `block px-3 py-2 text-sm font-medium rounded-md ${
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                        onClick={onClose}
                      >
                        # {channel.name}
                      </NavLink>
                    ))}
                    <NavLink
                      to="/channels"
                      className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:bg-gray-100 rounded-md"
                      onClick={onClose}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Channel
                    </NavLink>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;