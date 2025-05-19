import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { TaskProvider } from '../../contexts/TaskContext';
import { ChannelProvider } from '../../contexts/ChannelContext';
import { ChatProvider } from '../../contexts/ChatContext';
import { DirectMessageProvider } from '../../contexts/DirectMessageContext';
import { useState } from 'react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ChannelProvider>
      <TaskProvider>
        <ChatProvider>
          <DirectMessageProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <main className="flex-1 overflow-auto p-4 md:p-6 w-full">
                  <Outlet />
                </main>
              </div>
            </div>
          </DirectMessageProvider>
        </ChatProvider>
      </TaskProvider>
    </ChannelProvider>
  );
};

export default Layout;