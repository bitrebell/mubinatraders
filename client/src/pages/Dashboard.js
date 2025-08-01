import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  UsersIcon,
  TrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, isAdmin, isTeacher } = useAuth();

  const stats = [
    {
      name: 'My Notes',
      value: '12',
      icon: DocumentTextIcon,
      change: '+2',
      changeType: 'increase',
      color: 'bg-blue-500'
    },
    {
      name: 'Question Papers',
      value: '8',
      icon: DocumentDuplicateIcon,
      change: '+1',
      changeType: 'increase',
      color: 'bg-green-500'
    },
    {
      name: 'Total Downloads',
      value: '156',
      icon: CloudArrowUpIcon,
      change: '+23',
      changeType: 'increase',
      color: 'bg-purple-500'
    },
    {
      name: 'Active Users',
      value: '2,543',
      icon: UsersIcon,
      change: '+12%',
      changeType: 'increase',
      color: 'bg-orange-500'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'upload',
      title: 'Data Structures Notes - Chapter 5',
      time: '2 hours ago',
      status: 'approved'
    },
    {
      id: 2,
      type: 'download',
      title: 'Computer Networks Final Exam 2023',
      time: '4 hours ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'upload',
      title: 'Operating Systems Mid-term Solutions',
      time: '1 day ago',
      status: 'pending'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Welcome back,
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {user?.name}
                </dd>
                <dd className="text-sm text-gray-500">
                  {user?.department} • {user?.role === 'student' ? `Semester ${user?.semester}` : user?.role}
                </dd>
              </dl>
            </div>
            <div className="ml-5 flex-shrink-0">
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                Last login: {new Date(user?.lastLogin).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${item.color} rounded-lg p-3`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {item.value}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUpIcon className="h-4 w-4 mr-1" />
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === 'upload' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {activity.type === 'upload' ? (
                        <CloudArrowUpIcon className={`h-4 w-4 ${
                          activity.type === 'upload' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <DocumentTextIcon className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <a
                href="#"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all activity
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-700">Upload New Notes</span>
              </button>
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <DocumentDuplicateIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-700">Add Question Paper</span>
              </button>
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <UsersIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-700">Browse Community</span>
              </button>
              {(isAdmin || isTeacher) && (
                <button className="w-full flex items-center px-4 py-3 border border-primary-300 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
                  <ClockIcon className="h-5 w-5 text-primary-600 mr-3" />
                  <span className="text-sm font-medium text-primary-700">Review Pending Uploads</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <TrendingUpIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-primary-800">
                Welcome to College Notes Manager!
              </h3>
              <div className="mt-2 text-sm text-primary-700">
                <p>
                  Start by uploading your notes or browsing existing materials. 
                  Help build our community knowledge base!
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    className="bg-primary-50 px-2 py-1.5 rounded-md text-sm font-medium text-primary-800 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-50 focus:ring-primary-600"
                  >
                    Get Started
                  </button>
                  <button
                    type="button"
                    className="ml-3 bg-primary-50 px-2 py-1.5 rounded-md text-sm font-medium text-primary-800 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-50 focus:ring-primary-600"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
