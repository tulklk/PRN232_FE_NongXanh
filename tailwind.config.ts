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
        body: '13px',
        h1: '36px',
        h2: '30px',
        h3: '24px',
        h4: '20px',
        h5: '18px',
        h6: '16px',
      },
      lineHeight: {
        body: '1.42857143',
      },
    },
  },
  plugins: [],
}
export default config
