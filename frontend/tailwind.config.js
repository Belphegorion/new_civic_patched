/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Modern gradient-inspired color palette (inspired by SalesRadar)
        'primary': '#5B37E9',        // Rich purple-blue
        'primary-light': '#E8E1FF',  // Very light purple
        'primary-dark': '#4C2DB8',   // Darker purple
        'primary-gradient-start': '#5B37E9',
        'primary-gradient-end': '#7C3AED',
        'secondary': '#10B981',      // Emerald green
        'secondary-light': '#D1FAE5', // Light green
        'accent': '#EF4444',         // Clean red for alerts
        'accent-light': '#FEE2E2',   // Light red
        'warning': '#F59E0B',        // Amber warning
        'warning-light': '#FEF3C7',  // Light amber
        'success': '#10B981',        // Emerald green
        'success-light': '#D1FAE5',  // Light green
        'info': '#3B82F6',          // Blue
        'info-light': '#DBEAFE',    // Light blue
        
        // Dark mode enhanced colors
        'dark-primary': '#50207A',   // Deep purple for dark mode primary
        'dark-accent': '#D6B9FC',    // Light lavender for dark mode accents
        'dark-highlight': '#838CE5', // Periwinkle blue for highlights in dark mode
        
        // Neutral grays - very light and minimal
        'gray-50': '#FAFBFC',       // Almost white background
        'gray-100': '#F4F6F8',      // Light background
        'gray-200': '#E5E7EB',      // Border color
        'gray-300': '#D1D5DB',      // Subtle borders
        'gray-400': '#9CA3AF',      // Placeholder text
        'gray-500': '#6B7280',      // Secondary text
        'gray-600': '#4B5563',      // Primary text light
        'gray-700': '#374151',      // Primary text
        'gray-800': '#1F2937',      // Dark text
        'gray-900': '#111827',      // Darkest text
        
        // Semantic colors using the new palette
        'background': '#FAFBFC',     // Main background
        'surface': '#FFFFFF',        // Card/surface background
        'surface-hover': '#F4F6F8',  // Hover states
        'border': '#E5E7EB',         // Default borders
        'border-light': '#F4F6F8',   // Light borders
        'text-primary': '#374151',    // Main text
        'text-secondary': '#6B7280',  // Secondary text
        'text-muted': '#9CA3AF',     // Muted text
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(214, 185, 252, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(214, 185, 252, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
