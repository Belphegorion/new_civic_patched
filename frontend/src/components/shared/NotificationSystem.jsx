import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const NotificationSystem = () => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Use Socket.IO service for notifications
    const initNotifications = async () => {
      try {
        const { initiateSocketConnection, subscribeToNotifications } = await import('../../services/socketService.js');
        
        initiateSocketConnection();
        
        subscribeToNotifications((data) => {
          addNotification({
            id: Date.now(),
            title: data.title || 'New Update',
            message: data.message,
            type: data.type || 'info',
            timestamp: new Date()
          });

          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(data.title || 'CivicReport Update', {
              body: data.message,
              icon: '/vite.svg',
              badge: '/vite.svg'
            });
          }
        });
      } catch (error) {
        console.warn('Notification system initialization failed:', error.message);
      }
    };
    
    initNotifications();
  }, [isAuthenticated, user, addNotification]);

  return null; // This component doesn't render anything
};

export default NotificationSystem;