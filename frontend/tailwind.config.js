/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#006591',
        'primary-container': '#0ea5e9',
        'on-primary': '#ffffff',
        'on-primary-container': '#003751',
        'on-primary-fixed': '#001e2f',
        'on-primary-fixed-variant': '#004c6e',
        'primary-fixed': '#c9e6ff',
        'primary-fixed-dim': '#89ceff',
        'inverse-primary': '#89ceff',

        secondary: '#006c49',
        'secondary-container': '#6cf8bb',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#00714d',
        'on-secondary-fixed': '#002113',
        'on-secondary-fixed-variant': '#005236',
        'secondary-fixed': '#6ffbbe',
        'secondary-fixed-dim': '#4edea3',

        tertiary: '#b91a24',
        'tertiary-container': '#ff6c66',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#6e000c',
        'on-tertiary-fixed': '#410004',
        'on-tertiary-fixed-variant': '#930013',
        'tertiary-fixed': '#ffdad7',
        'tertiary-fixed-dim': '#ffb3ad',

        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        surface: '#f8f9ff',
        'surface-dim': '#ccdbf3',
        'surface-bright': '#f8f9ff',
        'surface-container': '#e6eeff',
        'surface-container-low': '#eff4ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d5e3fc',
        'surface-variant': '#d5e3fc',
        'surface-tint': '#006591',
        background: '#f8f9ff',

        'on-surface': '#0d1c2e',
        'on-surface-variant': '#3e4850',
        'on-background': '#0d1c2e',

        outline: '#6e7881',
        'outline-variant': '#bec8d2',

        'inverse-surface': '#233144',
        'inverse-on-surface': '#eaf1ff',

        'warning-container': '#fff2c7',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        cloud: '0 20px 40px rgba(13, 28, 46, 0.06)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #006591 0%, #0ea5e9 100%)',
        'surface-wash':
          'radial-gradient(circle at top left, rgba(14,165,233,0.12), transparent 36%), radial-gradient(circle at bottom right, rgba(185,26,36,0.08), transparent 30%)',
      },
    },
  },
  plugins: [],
};
