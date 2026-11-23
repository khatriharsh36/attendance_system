/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#101F38',
          DEFAULT: '#172B4D',
          light: '#243F6B',
        },
        academic: {
          DEFAULT: '#315E86',
          dark: '#244867',
          light: '#437CAE',
          soft: '#EAF1F7',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F7F8FA',
          subtle: '#EEF2F6',
        },
        brandText: {
          main: '#202B38',
          secondary: '#667586',
          muted: '#8C9BAE',
        },
        border: {
          DEFAULT: '#E3E8EE',
          dark: '#CCD4DF',
        },
        status: {
          success: '#32846C',
          'success-bg': '#EDF7F4',
          warning: '#C58A34',
          'warning-bg': '#FDF6EB',
          danger: '#C45454',
          'danger-bg': '#FDECEC',
          info: '#477FA8',
          'info-bg': '#EDF5FA',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        card: '0 1px 4px 0 rgba(23, 43, 77, 0.06)',
        dropdown: '0 4px 12px 0 rgba(23, 43, 77, 0.10)',
        modal: '0 12px 32px 0 rgba(23, 43, 77, 0.16)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
