/** Design System V1 — Tailwind theme (Majestic Cyber brand gradient) */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#030304',
        surface: {
          DEFAULT: '#0F1115',
          elevated: '#171A20',
        },
        primary: '#ff6b2c',
        secondary: '#ab0063',
        tertiary: '#4a0084',
        gold: '#FFD600',
        muted: '#94A3B8',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        card: '16px',
        xl: '24px',
        button: '999px',
      },
      spacing: {
        18: '72px',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        orange: '0 0 24px rgba(255, 107, 44, 0.5)',
        magenta: '0 0 24px rgba(171, 0, 99, 0.35)',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #ff6b2c 0%, #ab0063 50%, #4a0084 100%)',
      },
    },
  },
};
