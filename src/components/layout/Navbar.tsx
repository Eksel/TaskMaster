import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, CheckSquare, User } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { currentUser, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm px-4 py-2.5">
      <div className="flex justify-between items-center">
        {/* Logo and brand */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="md:hidden mr-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link 
            to="/" 
            className="flex items-center text-primary-600 font-bold text-xl"
          >
            <CheckSquare className="mr-2 h-6 w-6" />
            <span className="hidden sm:inline">TaskMaster</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="flex items-center">
          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Open user menu"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
              </div>
              <span className="font-medium text-sm hidden lg:block">
                {currentUser?.displayName || 'User'}
              </span>
            </button>

            {/* Dropdown menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-elevation-2 py-1 z-10 animate-fade-in">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;