import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  UserIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = () => {
  const { user } = useAuth();
  const { sidebarOpen, closeSidebar } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['student', 'teacher', 'admin'] },
    { name: 'Events', href: '/events', icon: CalendarDaysIcon, roles: ['student', 'teacher', 'admin'] },
    { name: 'Notes', href: '/notes', icon: DocumentTextIcon, roles: ['student', 'teacher', 'admin'] },
    { name: 'Courses', href: '/courses', icon: AcademicCapIcon, roles: ['student', 'teacher', 'admin'] },
    { name: 'Profile', href: '/profile', icon: UserIcon, roles: ['student', 'teacher', 'admin'] },
  ];

  const adminNavigation = [
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, roles: ['admin'] },
    { name: 'User Management', href: '/admin/users', icon: UsersIcon, roles: ['admin'] },
    { name: 'System Settings', href: '/admin/settings', icon: Cog6ToothIcon, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const filteredAdminNavigation = adminNavigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:top-16">
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-200'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  } group flex items-center px-2 py-2 border-l-4 text-sm font-medium transition-colors`}
                >
                  <item.icon
                    className={`${
                      isActive(item.href)
                        ? 'text-primary-500 dark:text-primary-300'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    } mr-3 flex-shrink-0 h-6 w-6 transition-colors`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}

              {/* Admin section */}
              {filteredAdminNavigation.length > 0 && (
                <div className="mt-8">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Administration
                  </h3>
                  <div className="mt-2 space-y-1">
                    {filteredAdminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          isActive(item.href)
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-200'
                            : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        } group flex items-center px-2 py-2 border-l-4 text-sm font-medium transition-colors`}
                      >
                        <item.icon
                          className={`${
                            isActive(item.href)
                              ? 'text-primary-500 dark:text-primary-300'
                              : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                          } mr-3 flex-shrink-0 h-6 w-6 transition-colors`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CM</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              College Management
            </span>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            onClick={closeSidebar}
          >
            <span className="sr-only">Close sidebar</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={closeSidebar}
              className={`${
                isActive(item.href)
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-200'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              } group flex items-center px-2 py-2 border-l-4 text-sm font-medium transition-colors`}
            >
              <item.icon
                className={`${
                  isActive(item.href)
                    ? 'text-primary-500 dark:text-primary-300'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                } mr-3 flex-shrink-0 h-6 w-6 transition-colors`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}

          {/* Mobile Admin section */}
          {filteredAdminNavigation.length > 0 && (
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Administration
              </h3>
              <div className="mt-2 space-y-1">
                {filteredAdminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={`${
                      isActive(item.href)
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-200'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    } group flex items-center px-2 py-2 border-l-4 text-sm font-medium transition-colors`}
                  >
                    <item.icon
                      className={`${
                        isActive(item.href)
                          ? 'text-primary-500 dark:text-primary-300'
                          : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      } mr-3 flex-shrink-0 h-6 w-6 transition-colors`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
