/** Enterprise Bitcoin Design System V1 — Tailwind theme extension */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#030304',
        surface: {
          DEFAULT: '#0F1115',
          elevated: '#171A20',
        },
        primary: '#F7931A',
        secondary: '#EA580C',
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
        orange: '0 0 24px rgba(247, 147, 26, 0.5)',
        gold: '0 0 24px rgba(255, 214, 0, 0.3)',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
    },
  },
};
