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
      
      // 🎯 优化的字体大小系统（移动端友好）
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.125rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.375rem' }],     // 14px
        'base': ['1rem', { lineHeight: '1.625rem' }],       // 16px - 移动端基础
        'lg': ['1.125rem', { lineHeight: '1.875rem' }],     // 18px
        'xl': ['1.25rem', { lineHeight: '2rem' }],          // 20px
        '2xl': ['1.5rem', { lineHeight: '2.25rem' }],       // 24px
        '3xl': ['1.875rem', { lineHeight: '2.5rem' }],      // 30px
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],      // 36px
        // 移动端专用字体大小
        'mobile-xs': ['0.75rem', { lineHeight: '1.125rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.375rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.625rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.875rem' }],
        'mobile-xl': ['1.25rem', { lineHeight: '2rem' }],
        'mobile-2xl': ['1.5rem', { lineHeight: '2.25rem' }],
      },

      // 🎯 优化的间距系统
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // 移动端安全区域
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // 🎯 移动端友好的圆角系统
      borderRadius: {
        'lg': '0.75rem',      // 12px
        'xl': '1rem',         // 16px
        '2xl': '1.25rem',     // 20px
        '3xl': '1.5rem',      // 24px
        '4xl': '2rem',        // 32px
        '5xl': '2.5rem',      // 40px
        // 移动端专用圆角
        'mobile-sm': '0.5rem',
        'mobile-md': '0.75rem',
        'mobile-lg': '1rem',
        'mobile-xl': '1.25rem',
        'mobile-2xl': '1.5rem',
      },

      // 🎯 优化的阴影系统（多层次）
      boxShadow: {
        // 移动端专用阴影
        'mobile': '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        'mobile-xl': '0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.10)',
        'mobile-2xl': '0 12px 32px rgba(0, 0, 0, 0.18), 0 6px 16px rgba(0, 0, 0, 0.12)',
        
        // 卡片专用阴影
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.10)',
        'card-active': '0 2px 12px rgba(0, 0, 0, 0.15), 0 1px 6px rgba(0, 0, 0, 0.10)',
        
        // 浮动元素阴影
        'float': '0 6px 24px rgba(0, 0, 0, 0.12), 0 3px 12px rgba(0, 0, 0, 0.08)',
        'float-lg': '0 10px 40px rgba(0, 0, 0, 0.15), 0 5px 20px rgba(0, 0, 0, 0.10)',
        
        // 内阴影
        'inner-soft': 'inset 0 1px 3px rgba(0, 0, 0, 0.06)',
        'inner-md': 'inset 0 2px 6px rgba(0, 0, 0, 0.08)',
      },

      // 🎯 现代化渐变色彩
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // 主题渐变
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-error': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        // 状态渐变
        'gradient-active': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        'gradient-completed': 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
        'gradient-pending': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-overdue': 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        // 背景渐变
        'gradient-bg-light': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        'gradient-bg-dark': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      },

      // 🎯 增强的色彩系统
      colors: {
        // 主题色彩增强
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // 状态色彩
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // 移动端专用语义色彩
        mobile: {
          card: '#ffffff',
          'card-dark': '#1f2937',
          border: '#e5e7eb',
          'border-dark': '#374151',
          text: '#111827',
          'text-dark': '#f9fafb',
          'text-secondary': '#6b7280',
          'text-secondary-dark': '#9ca3af',
        }
      },

      // 🎯 动画优化
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'pulse-gentle': 'pulseGentle 2s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        // 移动端专用动画
        'mobile-bounce': 'mobileBounce 0.3s ease-out',
        'mobile-scale': 'mobileScale 0.2s ease-out',
      },

      // 🎯 动画关键帧
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
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
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        bounceGentle: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0, -5px, 0)' },
          '70%': { transform: 'translate3d(0, -3px, 0)' },
          '90%': { transform: 'translate3d(0, -1px, 0)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        mobileBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        mobileScale: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.98)' },
        },
      },

      // 🎯 移动端优化的Z-index
      zIndex: {
        'behind': '-1',
        'base': '0',
        'navbar': '100',
        'dropdown': '200',
        'overlay': '300',
        'modal': '400',
        'modal-backdrop': '390',
        'fullscreen': '500',
        'toast': '600',
        'tooltip': '700',
      },

      // 🎯 背景模糊效果增强
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },

      // 🎯 响应式断点定制
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2.5rem',
          '2xl': '3rem',
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
    // 🎯 移动端优化插件增强
    function({ addUtilities, addComponents, theme }) {
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
        '.touch-pan-x': {
          touchAction: 'pan-x',
        },
        '.touch-pan-y': {
          touchAction: 'pan-y',
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
        '.gpu-hover': {
          transform: 'translate3d(0, 0, 0)',
          transition: 'transform 0.2s ease-out',
        },
        // 平滑滚动
        '.smooth-scroll': {
          '-webkit-overflow-scrolling': 'touch',
          scrollBehavior: 'smooth',
        },
        // 移动端按钮优化
        '.btn-mobile': {
          minHeight: '44px',
          minWidth: '44px',
          padding: '12px 16px',
          fontSize: '16px',
          fontWeight: '500',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'manipulation',
          userSelect: 'none',
          '-webkit-user-select': 'none',
          '-webkit-touch-callout': 'none',
        },
        // 卡片组件基础样式
        '.card-mobile': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.mobile-xl'),
          boxShadow: theme('boxShadow.mobile'),
          border: `1px solid ${theme('colors.gray.200')}`,
          transition: 'all 0.2s ease-out',
        },
        '.card-mobile-hover': {
          '&:hover': {
            boxShadow: theme('boxShadow.mobile-lg'),
            transform: 'translateY(-1px)',
          },
          '&:active': {
            boxShadow: theme('boxShadow.card-active'),
            transform: 'translateY(0)',
          },
        },
        // 暗色模式卡片
        '.dark .card-mobile': {
          backgroundColor: theme('colors.gray.800'),
          borderColor: theme('colors.gray.700'),
        },
        // 玻璃形态效果
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(55, 65, 81, 0.3)',
        },
        '.dark .glass': {
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          borderColor: 'rgba(55, 65, 81, 0.3)',
        },
      }

      const newComponents = {
        // 移动端专用按钮组件
        '.btn-primary-mobile': {
          ...newUtilities['.btn-mobile'],
          background: theme('backgroundImage.gradient-primary'),
          color: theme('colors.white'),
          boxShadow: theme('boxShadow.mobile'),
          '&:hover': {
            boxShadow: theme('boxShadow.mobile-lg'),
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
          },
        },
        '.btn-secondary-mobile': {
          ...newUtilities['.btn-mobile'],
          backgroundColor: theme('colors.white'),
          color: theme('colors.gray.700'),
          border: `1px solid ${theme('colors.gray.300')}`,
          boxShadow: theme('boxShadow.card'),
          '&:hover': {
            backgroundColor: theme('colors.gray.50'),
            boxShadow: theme('boxShadow.mobile'),
          },
        },
      }

      addUtilities(newUtilities)
      addComponents(newComponents)
    }
  ],
  // DaisyUI配置增强
  daisyui: {
    themes: [
      {
        light: {
          primary: '#3b82f6',
          'primary-focus': '#2563eb',
          'primary-content': '#ffffff',
          secondary: '#8b5cf6',
          'secondary-focus': '#7c3aed',
          'secondary-content': '#ffffff',
          accent: '#06b6d4',
          'accent-focus': '#0891b2',
          'accent-content': '#ffffff',
          neutral: '#374151',
          'neutral-focus': '#4b5563',
          'neutral-content': '#ffffff',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#f3f4f6',
          'base-content': '#1f2937',
          info: '#06b6d4',
          'info-content': '#ffffff',
          success: '#10b981',
          'success-content': '#ffffff',
          warning: '#f59e0b',
          'warning-content': '#ffffff',
          error: '#ef4444',
          'error-content': '#ffffff',
        },
        dark: {
          primary: '#3b82f6',
          'primary-focus': '#60a5fa',
          'primary-content': '#ffffff',
          secondary: '#8b5cf6',
          'secondary-focus': '#a78bfa',
          'secondary-content': '#ffffff',
          accent: '#06b6d4',
          'accent-focus': '#22d3ee',
          'accent-content': '#ffffff',
          neutral: '#d1d5db',
          'neutral-focus': '#e5e7eb',
          'neutral-content': '#1f2937',
          'base-100': '#1f2937',
          'base-200': '#374151',
          'base-300': '#4b5563',
          'base-content': '#f9fafb',
          info: '#06b6d4',
          'info-content': '#ffffff',
          success: '#10b981',
          'success-content': '#ffffff',
          warning: '#f59e0b',
          'warning-content': '#ffffff',
          error: '#ef4444',
          'error-content': '#ffffff',
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