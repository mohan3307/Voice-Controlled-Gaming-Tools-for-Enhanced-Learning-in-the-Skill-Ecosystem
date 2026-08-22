/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        darkSurface: '#1e293b',
        glassBg: 'rgba(30, 41, 59, 0.7)',
        neonCyan: '#06b6d4',
        neonPurple: '#a855f7',
        neonPink: '#ec4899',
        neonYellow: '#f59e0b',
        laserGreen: '#10b981',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glowCyan: '0 0 15px rgba(6, 182, 212, 0.4)',
        glowPurple: '0 0 15px rgba(168, 85, 247, 0.4)',
        glowGreen: '0 0 15px rgba(16, 185, 129, 0.4)',
      },
      backgroundImage: {
        'futuristic-grid': "radial-gradient(circle, rgba(168, 85, 247, 0.15) 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
