import React, { createContext, useState, useCallback, useContext } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    return useContext(NotificationContext);
}

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    
    const addNotification = useCallback((newNotification) => {
        const notificationWithId = { ...newNotification, id: Date.now(), isRead: false };
        setNotifications(prev => [notificationWithId, ...prev]);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const value = { notifications, unreadCount, isPanelOpen, setIsPanelOpen, addNotification, markAsRead };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};