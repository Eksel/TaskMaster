import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import TodoView from './pages/todo/TodoView';
import CalendarView from './pages/calendar/CalendarView';
import Profile from './pages/profile/Profile';
import UserProfile from './pages/profile/UserProfile';
import Channels from './pages/channels/Channels';
import ChannelDetails from './pages/channels/ChannelDetails';
import DirectMessages from './pages/DirectMessages';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { checkAuthState } = useAuth();
  
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="todo" element={<TodoView />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="profile" element={<Profile />} />
        <Route path="user/:userId" element={<UserProfile />} />
        <Route path="channels" element={<Channels />} />
        <Route path="channels/:channelId" element={<ChannelDetails />} />
        <Route path="messages" element={<DirectMessages />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;