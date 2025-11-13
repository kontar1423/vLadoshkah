/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'green': {
          0: '#000000',
          10: '#002110',
          20: '#00381F',
          30: '#00522C',
          40: '#006C35',
          50: '#128937',
          60: '#1AA64A',
          70: '#44C265',
          80: '#80DA88',
          90: '#BEEFBB',
          95: '#DDF8D8',
          98: '#F2FCEF',
          100: '#FFFFFF',
        }
      },
      fontFamily: {
  'inter': ['Inter', 'sans-serif'],
  'sf-rounded': ['SF Pro Rounded', 'system-ui', 'sans-serif'],
},
      maxWidth: {
        'container': '1280px',
      },
      borderRadius: {
        'custom': '40px',
        'custom-small': '20px',
      },
    },
  },
  plugins: [],
}