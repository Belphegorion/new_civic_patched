import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';
import './styles/components.css';

import { AuthProvider } from './contexts/AuthContext.jsx';
import { ReportsProvider } from './contexts/ReportsContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';

// Disable service worker for now to fix network issues
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <ReportsProvider>
          <App />
        </ReportsProvider>
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);