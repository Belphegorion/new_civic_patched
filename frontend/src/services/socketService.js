import { io } from 'socket.io-client';

let socket;

export const initiateSocketConnection = () => {
  const token = localStorage.getItem('token');
  if (!token || socket) return;
  
  try {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketUrl, { 
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    socket.on('connect_error', (error) => {
      console.warn('Socket connection failed:', error.message);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  } catch (error) {
    console.warn('Socket initialization failed:', error.message);
  }
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const subscribeToNotifications = (callback) => {
  if (socket) {
    socket.on('new_notification', (data) => callback(data));
    socket.on('report_update', (data) => callback(data));
    socket.on('status_change', (data) => callback(data));
  }
};

export const unsubscribeFromNotifications = () => {
  if (socket) {
    socket.off('new_notification');
    socket.off('report_update');
    socket.off('status_change');
  }
};

export const getSocketStatus = () => {
  return socket ? socket.connected : false;
};