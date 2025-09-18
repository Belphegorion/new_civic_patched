import React, { memo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { BellIcon, UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import DarkModeToggle from '../shared/DarkModeToggle.jsx';

const NotificationBell = memo(() => {
    const { unreadCount, setIsPanelOpen } = useNotification();
    return (
        <button 
            onClick={() => setIsPanelOpen(true)} 
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all duration-200 group active:scale-95 hidden sm:block"
            aria-label="Notifications"
        >
            <BellIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 font-bold shadow-lg animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    )
});

const Navbar = memo(() => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Hide navbar on landing page
  if (location.pathname === '/') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Enhanced Logo */}
          <Link 
            to={isAuthenticated ? "/dashboard" : "/"} 
            onClick={closeMobileMenu}
            className="group flex items-center space-x-2 md:space-x-3 text-base md:text-xl font-bold transition-all duration-300 active:scale-95 md:hover:scale-105"
          >
            <div className="relative">
              <div className="w-7 h-7 md:w-10 md:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xs md:text-sm font-bold">CR</span>
              </div>
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent font-black tracking-tight">
              CivicReport
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <DarkModeToggle />
            {isAuthenticated ? (
              <>
                {user?.role === 'Admin' && (
                  <Link 
                    to="/admin" 
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="h-4 w-4 text-white"/>
                  </div>
                  <span className="text-sm font-medium text-gray-800 max-w-32 truncate">
                    {user?.name || user?.email}
                  </span>
                </div>
                <NotificationBell />
                <button 
                  onClick={handleLogout} 
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all duration-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                >
                  Sign in
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-1.5">
            <DarkModeToggle />
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <div className="px-3 pt-2 pb-4 space-y-2">
              {isAuthenticated ? (
                <>
                  {user?.role === 'Admin' && (
                    <Link 
                      to="/admin" 
                      onClick={closeMobileMenu}
                      className="block px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200 active:scale-98"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="h-5 w-5 text-white"/>
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                        {user?.name || user?.email}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="block w-full text-left px-4 py-3 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 active:scale-98"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200 active:scale-98"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg transition-all duration-300 text-center active:scale-98 mt-2"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
});
NotificationBell.displayName = 'NotificationBell';
Navbar.displayName = 'Navbar';

export default Navbar;