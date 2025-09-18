import React from 'react';

const Footer = () => (
    <footer className="bg-white dark:bg-gray-900 shadow-inner mt-auto border-t border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
        <p>&copy; {new Date().getFullYear()} Civic Reporting Platform</p>
      </div>
    </footer>
);
export default Footer;