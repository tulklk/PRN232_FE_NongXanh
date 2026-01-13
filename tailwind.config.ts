import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#0A923C',
          'green-dark': '#10723A',
          'green-light': '#86efac',
        },
        body: {
          bg: '#EEEEEE',
          color: '#373737',
        },
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'sans-serif'],
      },
      fontSize: {
        body: '11px',
        h1: '29px',
        h2: '24px',
        h3: '20px',
        h4: '16px',
        h5: '14px',
        h6: '13px',
      },
      lineHeight: {
        body: '1.42857143',
      },
    },
  },
  plugins: [],
}
export default config
