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
        bg: {
          primary: '#04040b',
          secondary: '#080812',
          card: '#0c0c1a',
          hover: '#10101f',
        },
        border: {
          DEFAULT: '#1a1a2e',
          subtle: '#12121e',
          strong: '#252540',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          muted: '#1d3557',
          glow: 'rgba(59,130,246,0.15)',
        },
        indigo: {
          DEFAULT: '#6366f1',
          muted: '#1e1b4b',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#64748b',
          muted: '#334155',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
          successBg: 'rgba(16,185,129,0.1)',
          warningBg: 'rgba(245,158,11,0.1)',
          errorBg: 'rgba(239,68,68,0.1)',
          infoBg: 'rgba(59,130,246,0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(26,26,46,1), 0 4px 16px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(59,130,246,0.15)',
        'glow-sm': '0 0 10px rgba(59,130,246,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
