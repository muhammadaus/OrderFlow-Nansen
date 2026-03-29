export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Trading Terminal Palette
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#12121a',
        'bg-card': '#1a1a24',
        'bg-elevated': '#22222e',

        // Borders
        'border-default': '#2a2a3a',
        'border-subtle': '#1f1f2a',
        'border-hover': '#3a3a4a',

        // Accent colors (NOT purple)
        'accent': '#00ff88',           // Mint green - primary
        'accent-secondary': '#00d4ff', // Cyan - secondary
        'accent-muted': '#00cc6a',     // Darker mint

        // Market colors
        'bull': '#00ff88',             // Green for gains
        'bear': '#ff4757',             // Red for losses
        'neutral': '#fbbf24',          // Amber for neutral

        // Signal colors
        'exhaustion': '#ff6b35',       // Orange
        'absorption': '#00d4ff',       // Cyan

        // Text
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b0',
        'text-muted': '#606070',
        'text-disabled': '#404050',

        // Legacy aliases for compatibility
        'void': '#0a0a0f',
        'midnight': '#12121a',
        'navy': '#1a1a24',
      },

      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },

      fontFamily: {
        // Monospace for data/code
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'monospace'],
        // Sans for body text
        sans: ['IBM Plex Sans', 'Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
      },

      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'accent': '0 0 20px rgba(0, 255, 136, 0.15)',
        'accent-strong': '0 0 30px rgba(0, 255, 136, 0.25)',
      },

      // Minimal, professional animations only
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
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
      },

      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}
