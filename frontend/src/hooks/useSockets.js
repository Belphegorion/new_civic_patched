import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { initiateSocketConnection, disconnectSocket, subscribeToNotifications } from '../services/socketService.js';

export const useSocket = (notificationCallback) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      initiateSocketConnection();
      // When a notification comes in from the socket, call the callback from the NotificationContext
      subscribeToNotifications(notificationCallback);

      return () => disconnectSocket();
    }
  }, [isAuthenticated, notificationCallback]);
};