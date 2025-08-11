/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,vue}'],
  theme: {
    extend: {
      // 移动端优化的屏幕断点
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // 移动端专用断点
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
      },
      
      // 优化的字体大小系统
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        // 移动端专用字体大小
        'mobile-xs': ['0.75rem', { lineHeight: '1.125rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.375rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.625rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.875rem' }],
      },

      // 优化的间距系统
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // 移动端安全区域
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // 移动端友好的圆角
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // 优化的阴影系统
      boxShadow: {
        'mobile': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'mobile-xl': '0 8px 24px rgba(0, 0, 0, 0.2)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'card-hover': '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
      },

      // 动画优化
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
      }, 

      zIndex: {
        'navbar': '100',
        'dropdown': '95',
        'modal': '200',
        'modal-backdrop': '190',
        'fullscreen': '200',
        'toast': '300',
      },

      // 动画关键帧
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0, -5px, 0)' },
          '70%': { transform: 'translate3d(0, -3px, 0)' },
          '90%': { transform: 'translate3d(0, -1px, 0)' },
        },
      },

      // 移动端优化的Z-index
      zIndex: {
        'modal': '1000',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'offcanvas': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },

      // 背景模糊效果
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [
    require('daisyui'),
    // 添加移动端优化插件
    function({ addUtilities }) {
      const newUtilities = {
        // 安全区域实用类
        '.safe-area-inset': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-area-inset-x': {
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-area-inset-y': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        // 触摸优化
        '.touch-manipulation': {
          touchAction: 'manipulation',
        },
        '.touch-none': {
          touchAction: 'none',
        },
        // 移动端优化的文本选择
        '.select-none-touch': {
          '-webkit-user-select': 'none',
          '-webkit-touch-callout': 'none',
          userSelect: 'none',
        },
        // 硬件加速
        '.gpu': {
          transform: 'translate3d(0, 0, 0)',
        },
        // 平滑滚动
        '.smooth-scroll': {
          '-webkit-overflow-scrolling': 'touch',
          scrollBehavior: 'smooth',
        },
      }
      addUtilities(newUtilities)
    }
  ],
  // DaisyUI配置
  daisyui: {
    themes: [
      {
        light: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          neutral: '#374151',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#f3f4f6',
          info: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        dark: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          neutral: '#d1d5db',
          'base-100': '#1f2937',
          'base-200': '#374151',
          'base-300': '#4b5563',
          info: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    rtl: false,
    prefix: '',
    logs: false,
  },
};