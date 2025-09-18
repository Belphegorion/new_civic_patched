import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, PlusCircleIcon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, DocumentTextIcon as DocumentTextIconSolid, 
         PlusCircleIcon as PlusCircleIconSolid, BellIcon as BellIconSolid, 
         UserCircleIcon as UserCircleIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const MobileNav = ({ onNewReport }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { unreadCount, setIsPanelOpen } = useNotification();
  
  // Don't show on login/register pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-40 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
      <div className="flex justify-around items-center h-16 px-1">
        <NavItem 
          to="/" 
          label="Home" 
          icon={location.pathname === '/' ? <HomeIconSolid className="w-6 h-6" /> : <HomeIcon className="w-6 h-6" />} 
          active={location.pathname === '/'}
        />
        
        {isAuthenticated && (
          <NavItem 
            to="/dashboard" 
            label="Reports" 
            icon={location.pathname === '/dashboard' ? <DocumentTextIconSolid className="w-6 h-6" /> : <DocumentTextIcon className="w-6 h-6" />} 
            active={location.pathname === '/dashboard'}
          />
        )}
        
        {isAuthenticated && (
          <NavItem 
            onClick={onNewReport} 
            label="New" 
            icon={<PlusCircleIcon className="w-8 h-8 text-primary" />} 
            className="-mt-6 bg-white dark:bg-gray-900 rounded-full p-1 border-2 border-primary shadow-lg"
          />
        )}
        
        {isAuthenticated && (
          <NavItem 
            onClick={() => setIsPanelOpen(true)}
            label="Alerts" 
            icon={<BellIcon className="w-6 h-6" />} 
            active={false}
            badge={unreadCount > 0 ? unreadCount : null}
          />
        )}
        
        <NavItem 
          to={isAuthenticated ? '/profile' : '/login'} 
          label={isAuthenticated ? 'Profile' : 'Login'} 
          icon={location.pathname === '/profile' ? <UserCircleIconSolid className="w-6 h-6" /> : <UserCircleIcon className="w-6 h-6" />} 
          active={location.pathname === '/profile'}
        />
      </div>
    </div>
  );
};

const NavItem = ({ to, label, icon, active, badge, onClick, className = '' }) => {
  const content = (
    <div className={`flex flex-col items-center justify-center px-2 py-2 ${active ? 'text-primary' : 'text-gray-500 dark:text-gray-400'} ${className}`}>
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center border border-white dark:border-gray-900 shadow-sm">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium mt-1">{label}</span>
    </div>
  );

  if (to && !onClick) {
    return (
      <Link to={to} className="flex-1 focus:outline-none active:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }
  
  return (
    <button onClick={onClick} className="flex-1 focus:outline-none active:opacity-80 transition-opacity" aria-label={label}>
      {content}
    </button>
  );
};

export default MobileNav;