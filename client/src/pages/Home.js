import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  BellIcon,
  StarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      name: 'Notes Management',
      description: 'Upload, organize, and share your college notes with classmates. Support for multiple file formats.',
      icon: DocumentTextIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Question Papers',
      description: 'Access previous year question papers organized by department, semester, and subject.',
      icon: DocumentDuplicateIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Easy Upload',
      description: 'Simple drag-and-drop interface for uploading your study materials and question papers.',
      icon: CloudArrowUpIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Email Notifications',
      description: 'Get notified when new notes or question papers are uploaded in your department.',
      icon: BellIcon,
      color: 'bg-orange-500'
    },
    {
      name: 'Rating System',
      description: 'Rate and review study materials to help others find the best resources.',
      icon: StarIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Collaborative',
      description: 'Build a community-driven knowledge base with your fellow students.',
      icon: UserGroupIcon,
      color: 'bg-indigo-500'
    }
  ];

  const stats = [
    { name: 'Active Students', value: '2,500+', icon: AcademicCapIcon },
    { name: 'Notes Shared', value: '15,000+', icon: DocumentTextIcon },
    { name: 'Question Papers', value: '3,200+', icon: DocumentDuplicateIcon },
    { name: 'Downloads', value: '50,000+', icon: ChartBarIcon }
  ];

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">CN</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">College Notes</span>
            </div>
          </div>
          <div className="flex lg:flex-1 lg:justify-end gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="btn btn-primary btn-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-400 to-secondary-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your College Notes, 
              <span className="gradient-text"> Organized</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              The ultimate platform for college students to share, organize, and access study materials. 
              Upload your notes, access previous year question papers, and build a collaborative learning community.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="btn btn-primary btn-lg"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="btn btn-outline btn-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Trusted by students across colleges
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                Join thousands of students who are already using our platform to excel in their studies.
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="flex flex-col bg-white/5 p-8">
                  <div className="flex items-center justify-center">
                    <stat.icon className="h-8 w-8 text-primary-400" />
                  </div>
                  <dt className="text-sm font-semibold leading-6 text-gray-300 mt-2">{stat.name}</dt>
                  <dd className="order-first text-3xl font-bold tracking-tight text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful features for effective studying
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform provides all the tools you need to organize, share, and access study materials efficiently.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <div className={`${feature.color} rounded-lg p-2`}>
                      <feature.icon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-primary-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to boost your studies?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Join our community today and get access to thousands of notes and question papers.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-50 btn-lg"
              >
                Get Started Now
              </Link>
              <Link
                to="/login"
                className="btn btn-ghost text-white border-white hover:bg-white/10 btn-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CN</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-white">College Notes</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} College Notes Manager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
