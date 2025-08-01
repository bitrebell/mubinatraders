import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProfilePage from './pages/Profile/ProfilePage';
import EventsPage from './pages/Events/EventsPage';
import EventDetailPage from './pages/Events/EventDetailPage';
import CreateEventPage from './pages/Events/CreateEventPage';
import NotesPage from './pages/Notes/NotesPage';
import NoteDetailPage from './pages/Notes/NoteDetailPage';
import CreateNotePage from './pages/Notes/CreateNotePage';
import CoursesPage from './pages/Courses/CoursesPage';
import CourseDetailPage from './pages/Courses/CourseDetailPage';
import AdminPage from './pages/Admin/AdminPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                
                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <DashboardPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ProfilePage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Events Routes */}
                <Route
                  path="/events"
                  element={
                    <Layout>
                      <EventsPage />
                    </Layout>
                  }
                />
                <Route
                  path="/events/:id"
                  element={
                    <Layout>
                      <EventDetailPage />
                    </Layout>
                  }
                />
                <Route
                  path="/events/create"
                  element={
                    <ProtectedRoute roles={['teacher', 'admin']}>
                      <Layout>
                        <CreateEventPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Notes Routes */}
                <Route
                  path="/notes"
                  element={
                    <Layout>
                      <NotesPage />
                    </Layout>
                  }
                />
                <Route
                  path="/notes/:id"
                  element={
                    <Layout>
                      <NoteDetailPage />
                    </Layout>
                  }
                />
                <Route
                  path="/notes/create"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CreateNotePage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Courses Routes */}
                <Route
                  path="/courses"
                  element={
                    <Layout>
                      <CoursesPage />
                    </Layout>
                  }
                />
                <Route
                  path="/courses/:id"
                  element={
                    <Layout>
                      <CourseDetailPage />
                    </Layout>
                  }
                />
                
                {/* Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Layout>
                        <AdminPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 Page */}
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
              
              {/* Global Components */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    theme: {
                      primary: '#22c55e',
                    },
                  },
                  error: {
                    duration: 5000,
                    theme: {
                      primary: '#ef4444',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
      
      {/* React Query Devtools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;
