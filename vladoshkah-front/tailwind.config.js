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
      animation: {
        'fade-in-up': 'fadeInUp 1.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'gentle-float': 'gentle-float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { 
            transform: 'translateY(0) translateX(-50%)' 
          },
          '50%': { 
            transform: 'translateY(-15px) translateX(-50%)' 
          },
        },
        gentleFloat: {
          '0%, 100%': { 
            transform: 'translateY(0) translateX(-50%) scale(1)' 
          },
          '25%': { 
            transform: 'translateY(-8px) translateX(-50%) scale(1.02)' 
          },
          '50%': { 
            transform: 'translateY(-15px) translateX(-50%) scale(1)' 
          },
          '75%': { 
            transform: 'translateY(-8px) translateX(-50%) scale(0.98)' 
          },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) translateX(-50%)',
            filter: 'blur(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) translateX(-50%)',
            filter: 'blur(0)'
          },
        }
      }
    },
  },
  plugins: [],
}