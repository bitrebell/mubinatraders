import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const { sidebarOpen, closeSidebar } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar for authenticated users */}
        {isAuthenticated && (
          <>
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity md:hidden"
                onClick={closeSidebar}
              />
            )}
            
            <Sidebar />
          </>
        )}
        
        {/* Main content */}
        <div className={`flex-1 ${isAuthenticated ? 'md:ml-64' : ''}`}>
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
