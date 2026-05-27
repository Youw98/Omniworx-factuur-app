/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
        opensans: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['1.125rem', { lineHeight: '1.75rem' }],
      },
      colors: {
        primary: {
          50:  '#E8F2F1',
          100: '#C5E0DE',
          200: '#9FCCC9',
          300: '#78B8B4',
          400: '#52A39F',
          500: '#2B8E89',
          600: '#0F4D4A',
          700: '#0C3C3A',
          800: '#0A3230',
          900: '#061E1D',
        },
        gold: {
          50:  '#FDF8EE',
          100: '#FAEFD4',
          200: '#F5E0A9',
          300: '#F0CA8A',
          400: '#EBC070',
          500: '#E7B260',
          600: '#C89040',
          700: '#A87030',
          800: '#885020',
          900: '#683010',
        },
      },
      minHeight: {
        touch: '48px',
        'touch-lg': '56px',
      },
    },
  },
  plugins: [],
}
