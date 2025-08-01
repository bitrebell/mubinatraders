import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CalendarDaysIcon, 
  DocumentTextIcon, 
  AcademicCapIcon,
  UserGroupIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Layout from '../../components/Layout/Layout';

const HomePage = () => {
  const features = [
    {
      name: 'Event Management',
      description: 'Stay updated with college events, workshops, and important announcements.',
      icon: CalendarDaysIcon,
      href: '/events',
      color: 'bg-blue-500',
    },
    {
      name: 'Study Notes',
      description: 'Access and share study materials organized by courses and subjects.',
      icon: DocumentTextIcon,
      href: '/notes',
      color: 'bg-green-500',
    },
    {
      name: 'Course Information',
      description: 'Explore courses, subjects, and academic structure.',
      icon: AcademicCapIcon,
      href: '/courses',
      color: 'bg-purple-500',
    },
    {
      name: 'Community',
      description: 'Connect with students and teachers across different departments.',
      icon: UserGroupIcon,
      href: '/register',
      color: 'bg-orange-500',
    },
    {
      name: 'Notifications',
      description: 'Get instant notifications about important updates and deadlines.',
      icon: BellIcon,
      href: '/register',
      color: 'bg-pink-500',
    },
    {
      name: 'Secure Platform',
      description: 'Your data is protected with enterprise-grade security measures.',
      icon: ShieldCheckIcon,
      href: '/register',
      color: 'bg-indigo-500',
    },
  ];

  const stats = [
    { name: 'Active Students', value: '2,000+' },
    { name: 'Courses Available', value: '50+' },
    { name: 'Study Materials', value: '1,500+' },
    { name: 'Events Hosted', value: '200+' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <Layout>
      <div className="relative">
        {/* Hero Section */}
        <motion.div 
          className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
              <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="sm:text-center lg:text-left">
                  <motion.h1 
                    className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <span className="block xl:inline">Welcome to</span>{' '}
                    <span className="block text-yellow-300 xl:inline">College Management</span>
                  </motion.h1>
                  <motion.p 
                    className="mt-3 text-base text-gray-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                  >
                    Your all-in-one platform for managing college events, sharing study notes, 
                    and staying connected with your academic community. Join thousands of students 
                    and educators already using our platform.
                  </motion.p>
                  <motion.div 
                    className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                  >
                    <div className="rounded-md shadow">
                      <Link
                        to="/register"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                      >
                        Get Started
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        to="/events"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 bg-opacity-20 hover:bg-opacity-30 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                      >
                        Explore Events
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </main>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="bg-white dark:bg-gray-800 py-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div 
                  key={stat.name} 
                  className="text-center"
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {stat.name}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="py-16 bg-gray-50 dark:bg-gray-900"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <motion.h2 
                className="text-base text-primary-600 dark:text-primary-400 font-semibold tracking-wide uppercase"
                variants={itemVariants}
              >
                Features
              </motion.h2>
              <motion.p 
                className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
                variants={itemVariants}
              >
                Everything you need for academic success
              </motion.p>
              <motion.p 
                className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto"
                variants={itemVariants}
              >
                Our comprehensive platform provides all the tools and resources you need 
                to excel in your academic journey.
              </motion.p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                  <motion.div 
                    key={feature.name}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 ${feature.color} rounded-md p-3`}>
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {feature.name}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                      {feature.description}
                    </p>
                    <div className="mt-6">
                      <Link
                        to={feature.href}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium text-sm transition-colors duration-200"
                      >
                        Learn more →
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="bg-primary-700"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-yellow-300">Join our community today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-primary-100">
              Create your account and start exploring all the features our platform has to offer.
            </p>
            <Link
              to="/register"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 sm:w-auto transition-colors duration-200"
            >
              Sign up for free
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default HomePage;
