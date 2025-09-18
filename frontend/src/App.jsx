import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import MobileNav from './components/layout/MobileNav.jsx';
import ErrorBoundary from './components/shared/ErrorBoundary.jsx';
import NotificationPanel from './components/layout/NotificationPanel.jsx';
import NotificationSystem from './components/shared/NotificationSystem.jsx';
import LoadingSpinner from './components/shared/LoadingSpinner.jsx';
import ReportForm from './components/citizen/ReportForm.jsx';

// Lazy load pages for better performance
const LandingPage = React.lazy(() => import('./pages/LandingPage.jsx'));
const Login = React.lazy(() => import('./pages/Login.jsx'));
const Register = React.lazy(() => import('./pages/Register.jsx'));
const CitizenDashboard = React.lazy(() => import('./pages/CitizenDashboard.jsx'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard.jsx'));
const ReportDetailsPage = React.lazy(() => import('./pages/ReportDetailsPage.jsx'));
const TestAuth = React.lazy(() => import('./pages/TestAuth.jsx'));

function App() {
  const [showReportForm, setShowReportForm] = useState(false);
  
  const handleNewReport = () => {
    setShowReportForm(true);
  };
  
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background dark:bg-gray-950 pb-16 sm:pb-0">
        <Navbar />
        <main className="flex-grow">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/test-auth" element={<TestAuth />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                  <ProtectedRoute><CitizenDashboard /></ProtectedRoute>
                </div>
              } />
              <Route path="/report/:id" element={
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                  <ProtectedRoute><ReportDetailsPage /></ProtectedRoute>
                </div>
              } />
              <Route path="/admin" element={
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                  <ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>
                </div>
              } />

              {/* Fallback Route */}
              <Route path="*" element={
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                  <div className="text-center py-8 sm:py-16">
                    <div className="max-w-md mx-auto px-4">
                      <div className="text-5xl sm:text-6xl font-light text-gray-400 dark:text-gray-600 mb-4">404</div>
                      <h2 className="text-xl sm:text-2xl font-semibold text-text-primary dark:text-gray-200 mb-2">Page Not Found</h2>
                      <p className="text-text-secondary dark:text-gray-400 mb-6">The page you are looking for does not exist.</p>
                      <a href="/" className="btn-primary inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 bg-primary text-white hover:bg-primary-dark shadow-lg hover:shadow-xl">Go Home</a>
                    </div>
                  </div>
                </div>
              } />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
        <NotificationPanel />
        <NotificationSystem />
        <MobileNav onNewReport={handleNewReport} />
        {showReportForm && <ReportForm isOpen={showReportForm} onClose={() => setShowReportForm(false)} />}
      </div>
    </Router>
  );
}

export default App;