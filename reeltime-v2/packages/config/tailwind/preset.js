/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Vintage Cinema palette (light mode)
        'rouge-cinema': '#D32F2F',
        'bordeaux-profond': '#B71C1C',
        'or-antique': '#FFD54F',
        'jaune-marquise': '#F9A825',
        'creme-ecran': '#FFF8E1',
        'beige-papier': '#EFEBE9',
        'sepia-chaud': '#8D6E63',
        'noir-velours': '#1A1A1A',
        // Dark mode surface colors
        dark: {
          primary: '#EF5350',
          surface: '#2D2D2D',
          background: '#1A1A1A',
          border: '#5D4037',
          'text-primary': '#FFF8E1',
          'text-secondary': '#BCAAA4',
        },
        // Semantic colors
        success: { light: '#4CAF50', dark: '#66BB6A' },
        warning: { light: '#FF9800', dark: '#FFA726' },
        error: { light: '#F44336', dark: '#EF5350' },
        info: { light: '#2196F3', dark: '#42A5F5' },
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
        crimson: ['Crimson Text', 'serif'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', fontWeight: '400' }],
        headline: ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        title: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        subtitle: ['16px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        label: ['11px', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.05em', textTransform: 'uppercase' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '8': '48px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
        ticket: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
        DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 20px rgba(0, 0, 0, 0.15)',
        vintage: '0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      },
    },
  },
};
