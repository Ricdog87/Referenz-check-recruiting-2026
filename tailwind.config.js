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
        // Modern professional palette - light, premium SaaS look
        bg: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
          card: '#ffffff',
          elevated: '#ffffff',
          hover: '#f8fafc',
          dark: '#0b1120',
        },
        border: {
          DEFAULT: 'rgba(15,23,42,0.08)',
          subtle: 'rgba(15,23,42,0.04)',
          strong: 'rgba(15,23,42,0.16)',
          focus: 'rgba(99,102,241,0.5)',
        },
        // Brand: Indigo → Violet gradient
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          muted: 'rgba(99,102,241,0.10)',
          glow: 'rgba(99,102,241,0.06)',
        },
        violet: {
          DEFAULT: '#8b5cf6',
          muted: 'rgba(139,92,246,0.10)',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          muted: 'rgba(6,182,212,0.10)',
        },
        emerald: {
          DEFAULT: '#10b981',
          muted: 'rgba(16,185,129,0.10)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          muted: 'rgba(245,158,11,0.10)',
        },
        rose: {
          DEFAULT: '#f43f5e',
          muted: 'rgba(244,63,94,0.10)',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8',
          disabled: '#cbd5e1',
          inverse: '#ffffff',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#f43f5e',
          info: '#4f46e5',
          successBg: 'rgba(16,185,129,0.10)',
          warningBg: 'rgba(245,158,11,0.10)',
          errorBg: 'rgba(244,63,94,0.10)',
          infoBg: 'rgba(99,102,241,0.10)',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'system-ui',
          'sans-serif',
        ],
        mono: ['var(--font-jetbrains-mono)', 'SF Mono', 'Fira Code', 'monospace'],
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
        card: '0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06)',
        'card-md': '0 4px 6px -1px rgba(15,23,42,0.06), 0 2px 4px -2px rgba(15,23,42,0.04)',
        'card-lg': '0 10px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.06)',
        'card-xl': '0 25px 50px -12px rgba(15,23,42,0.18)',
        float: '0 20px 60px -15px rgba(79,70,229,0.25), 0 10px 20px -10px rgba(15,23,42,0.08)',
        glow: '0 0 40px rgba(99,102,241,0.25)',
        'glow-lg': '0 0 80px rgba(99,102,241,0.3)',
        'glow-violet': '0 0 60px rgba(139,92,246,0.25)',
        'btn': '0 1px 2px rgba(15,23,42,0.08), 0 4px 14px rgba(79,70,229,0.25)',
        'btn-lg': '0 4px 14px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        inner: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1)',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'spin-slow': 'spin 18s linear infinite',
        'gradient-x': 'gradientX 8s ease infinite',
        'rotate-3d': 'rotate3d 20s linear infinite',
        'blob': 'blob 14s ease-in-out infinite',
        'marquee': 'marquee 35s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(99,102,241,0.2)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 60px rgba(99,102,241,0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-22px) rotate(2deg)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        rotate3d: {
          '0%': { transform: 'rotateY(0deg) rotateX(15deg)' },
          '100%': { transform: 'rotateY(360deg) rotateX(15deg)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(40px, -60px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.9)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.03em',
        tight: '-0.02em',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(at 0% 0%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139,92,246,0.12) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(6,182,212,0.10) 0px, transparent 50%)',
        'brand': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
        'brand-soft': 'linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)',
      },
    },
  },
  plugins: [],
}
