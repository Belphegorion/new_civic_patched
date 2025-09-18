import { useState, useLayoutEffect } from 'react';

/**
 * useDarkMode hook
 * - Stores preference in localStorage under 'darkMode'
 * - Sets the 'dark' class on document.documentElement and document.body
 * - Uses useLayoutEffect to avoid a flash of incorrect theme on first paint
 */
export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  // Apply class synchronously before paint to avoid flicker
  useLayoutEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', darkMode);
        // Some components/styles expect the class on body as well
        document.body.classList.toggle('dark', darkMode);
      }
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    } catch (e) {
      // ignore storage errors (e.g. private mode)
      // but ensure we don't crash the app
      console.warn('useDarkMode error', e);
    }
  }, [darkMode]);

  return [darkMode, setDarkMode];
};

export default useDarkMode;
