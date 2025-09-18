import React from 'react';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = () => {
    const { isPanelOpen, setIsPanelOpen, notifications, markAsRead } = useNotification();
    if (!isPanelOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" onClick={() => setIsPanelOpen(false)}>
            <div
                className="absolute top-0 right-0 h-full w-full max-w-[85vw] sm:max-w-sm bg-white dark:bg-gray-900 shadow-lg flex flex-col animate-slide-in-right"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-semibold dark:text-white">Notifications</h2>
                    <button 
                        onClick={() => setIsPanelOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close notifications"
                    >
                        <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                {notifications.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center p-6">
                        <p className="text-gray-500 dark:text-gray-400">You have no notifications.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto">
                        {notifications.map(n => (
                            <li key={n.id} onClick={() => markAsRead(n.id)}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                <p className="font-semibold text-gray-800">{n.title}</p>
                                <p className="text-gray-600 text-sm">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.id), { addSuffix: true })}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
export default NotificationPanel;