/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: { cyan: '#00f0ff', magenta: '#ff2bd6', purple: '#9d4bff', green: '#39ff14', yellow: '#fff200', orange: '#ff7a00', red: '#ff2d55', blue: '#2d7dff' },
        ink: { 900: '#05060f', 800: '#0a0d1f', 700: '#11142b', 600: '#1a1f3d', 500: '#262d52' },
      },
      fontFamily: {
        display: ['"Orbitron"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'ui-monospace', 'monospace'],
        body: ['"Rajdhani"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neonCyan: '0 0 8px #00f0ff, 0 0 24px rgba(0,240,255,0.45)',
        neonMagenta: '0 0 8px #ff2bd6, 0 0 24px rgba(255,43,214,0.45)',
        neonGreen: '0 0 8px #39ff14, 0 0 24px rgba(57,255,20,0.4)',
        neonPurple: '0 0 8px #9d4bff, 0 0 24px rgba(157,75,255,0.45)',
      },
      keyframes: {
        flicker: { '0%, 100%': { opacity: '1' }, '45%': { opacity: '0.85' }, '50%': { opacity: '0.6' }, '55%': { opacity: '0.9' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        gridFloat: { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '0 44px' } },
        pulseGlow: { '0%, 100%': { filter: 'brightness(1) drop-shadow(0 0 6px currentColor)' }, '50%': { filter: 'brightness(1.3) drop-shadow(0 0 14px currentColor)' } },
        slideIn: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
      },
      animation: {
        flicker: 'flicker 3s linear infinite',
        scan: 'scan 6s linear infinite',
        gridFloat: 'gridFloat 3s linear infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        slideIn: 'slideIn 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
