/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Apple HIG Dark Mode palette
        bg: {
          primary: '#000000',
          secondary: '#0a0a0a',
          card: '#141414',
          elevated: '#1c1c1e',
          hover: '#222224',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          subtle: 'rgba(255,255,255,0.04)',
          strong: 'rgba(255,255,255,0.18)',
          focus: 'rgba(10,132,255,0.6)',
        },
        accent: {
          DEFAULT: '#0a84ff',
          hover: '#0070e0',
          muted: 'rgba(10,132,255,0.12)',
          glow: 'rgba(10,132,255,0.06)',
        },
        indigo: {
          DEFAULT: '#5e5ce6',
          muted: 'rgba(94,92,230,0.12)',
        },
        text: {
          primary: '#ffffff',
          secondary: 'rgba(235,235,245,0.6)',
          muted: 'rgba(235,235,245,0.28)',
          disabled: 'rgba(235,235,245,0.18)',
        },
        status: {
          success: '#30d158',
          warning: '#ff9f0a',
          error: '#ff453a',
          info: '#0a84ff',
          successBg: 'rgba(48,209,88,0.1)',
          warningBg: 'rgba(255,159,10,0.1)',
          errorBg: 'rgba(255,69,58,0.1)',
          infoBg: 'rgba(10,132,255,0.1)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
        '4xl': '30px',
      },
      boxShadow: {
        card: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
        float: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        glow: '0 0 40px rgba(10,132,255,0.15)',
        'glow-sm': '0 0 20px rgba(10,132,255,0.1)',
        'btn': '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
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
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(10,132,255,0.2)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(10,132,255,0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
}
