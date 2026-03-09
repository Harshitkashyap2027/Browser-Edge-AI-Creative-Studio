import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'studio-bg': '#0d0d0d',
        'studio-panel': '#161616',
        'studio-secondary': '#1e1e1e',
        'studio-border': '#2d2d2d',
        'studio-accent': '#7c3aed',
        'studio-accent-light': '#8b5cf6',
      },
    },
  },
  plugins: [],
};

export default config;
