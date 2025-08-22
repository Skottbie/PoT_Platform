// src/components/EnhancedButton.jsx - 升级版按钮组件
import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const EnhancedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  gradient = false,
  glass = false,
  rounded = 'default',
  shadow = 'default',
  icon = null,
  iconPosition = 'left',
  haptic = false,
  className = '',
  ...props
}) => {
  // 触觉反馈
  const handleClick = (e) => {
    if (haptic && navigator.vibrate) {
      navigator.vibrate(10); // 轻微震动
    }
    if (props.onClick) {
      props.onClick(e);
    }
  };

  // 基础样式
  const baseStyles = `
    inline-flex items-center justify-center font-medium 
    transition-all duration-200 ease-out select-none relative overflow-hidden
    touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95 disabled:active:scale-100
  `;

  // 尺寸样式
  const sizeStyles = {
    xs: 'px-3 py-2 text-xs min-h-[32px] gap-1',
    sm: 'px-4 py-2.5 text-sm min-h-[36px] gap-1.5',
    md: 'px-5 py-3 text-base min-h-[44px] gap-2', // 移动端友好的最小高度
    lg: 'px-6 py-3.5 text-lg min-h-[48px] gap-2.5',
    xl: 'px-8 py-4 text-xl min-h-[52px] gap-3',
  };

  // 圆角样式
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-mobile-sm',
    default: 'rounded-mobile-lg',
    lg: 'rounded-mobile-xl',
    xl: 'rounded-mobile-2xl',
    full: 'rounded-full',
  };

  // 阴影样式
  const shadowStyles = {
    none: '',
    sm: 'shadow-card',
    default: 'shadow-mobile',
    lg: 'shadow-mobile-lg',
    xl: 'shadow-mobile-xl',
  };

  // 变体样式
  const variantStyles = {
    primary: gradient ? `
      bg-gradient-primary text-white font-semibold
      hover:shadow-mobile-lg hover:-translate-y-0.5
      focus:ring-blue-500/50 border-0
      before:absolute before:inset-0 before:bg-gradient-to-r 
      before:from-blue-400 before:to-purple-500 before:opacity-0 
      before:transition-opacity before:duration-200
      hover:before:opacity-20
    ` : `
      bg-blue-600 hover:bg-blue-700 text-white font-semibold
      focus:ring-blue-500/50 border-0
      hover:shadow-mobile-lg hover:-translate-y-0.5
    `,

    secondary: glass ? `
      glass backdrop-blur-xl text-gray-700 dark:text-gray-200 font-medium
      border border-white/20 dark:border-gray-700/30
      hover:bg-white/90 dark:hover:bg-gray-700/90
      hover:shadow-mobile-lg focus:ring-gray-500/50
    ` : `
      bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium
      border border-gray-300 dark:border-gray-600
      hover:bg-gray-50 dark:hover:bg-gray-700
      hover:shadow-mobile-lg focus:ring-gray-500/50
    `,
    
    success: gradient ? `
      bg-gradient-success text-white font-semibold
      hover:shadow-mobile-lg hover:-translate-y-0.5
      focus:ring-green-500/50 border-0
    ` : `
      bg-green-600 hover:bg-green-700 text-white font-semibold
      focus:ring-green-500/50 border-0
      hover:shadow-mobile-lg hover:-translate-y-0.5
    `,
    
    warning: gradient ? `
      bg-gradient-warning text-white font-semibold
      hover:shadow-mobile-lg hover:-translate-y-0.5
      focus:ring-orange-500/50 border-0
    ` : `
      bg-orange-600 hover:bg-orange-700 text-white font-semibold
      focus:ring-orange-500/50 border-0
      hover:shadow-mobile-lg hover:-translate-y-0.5
    `,
    
    danger: gradient ? `
      bg-gradient-error text-white font-semibold
      hover:shadow-mobile-lg hover:-translate-y-0.5
      focus:ring-red-500/50 border-0
    ` : `
      bg-red-600 hover:bg-red-700 text-white font-semibold
      focus:ring-red-500/50 border-0
      hover:shadow-mobile-lg hover:-translate-y-0.5
    `,
    
    ghost: `
      bg-transparent text-gray-600 dark:text-gray-300 font-medium
      border border-gray-300/50 dark:border-gray-600/50
      hover:bg-gray-50 dark:hover:bg-gray-800/50
      hover:border-gray-400 dark:hover:border-gray-500
      focus:ring-gray-500/50
    `,
    
    outline: `
      bg-transparent text-blue-600 dark:text-blue-400 font-medium
      border-2 border-blue-600 dark:border-blue-400
      hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900
      focus:ring-blue-500/50
    `,
    
    text: `
      bg-transparent text-blue-600 dark:text-blue-400 font-medium
      hover:bg-blue-50 dark:hover:bg-blue-900/20
      focus:ring-blue-500/50 border-0
    `,
  };

  return (
    <motion.button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        roundedStyles[rounded],
        shadowStyles[shadow],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {/* 加载状态覆盖层 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* 按钮内容 */}
      <span className={clsx(
        'flex items-center justify-center gap-2',
        loading && 'opacity-0'
      )}>
        {icon && iconPosition === 'left' && (
          <span className="text-current">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="text-current">{icon}</span>
        )}
      </span>
      
      {/* 悬停光效 */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-inherit">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-inherit" />
      </div>
    </motion.button>
  );
};

// 预设按钮组件
export const PrimaryButton = (props) => (
  <EnhancedButton variant="primary" gradient shadow="default" haptic {...props} />
);

export const SecondaryButton = (props) => (
  <EnhancedButton variant="secondary" glass shadow="sm" {...props} />
);

export const SuccessButton = (props) => (
  <EnhancedButton variant="success" gradient shadow="default" haptic {...props} />
);

export const WarningButton = (props) => (
  <EnhancedButton variant="warning" gradient shadow="default" haptic {...props} />
);

export const DangerButton = (props) => (
  <EnhancedButton variant="danger" gradient shadow="default" haptic {...props} />
);

export const GhostButton = (props) => (
  <EnhancedButton variant="ghost" shadow="none" {...props} />
);

export const TextButton = (props) => (
  <EnhancedButton variant="text" shadow="none" {...props} />
);

// 图标按钮
export const IconButton = ({ icon, ...props }) => (
  <EnhancedButton
    size="md"
    rounded="full"
    className="!min-w-[44px] !w-11 !h-11 !p-0"
    {...props}
  >
    {icon}
  </EnhancedButton>
);

// 浮动操作按钮
export const FloatingActionButton = ({ icon, ...props }) => (
  <EnhancedButton
    variant="primary"
    size="lg"
    rounded="full"
    gradient
    shadow="float"
    className="!w-14 !h-14 !p-0 fixed bottom-6 right-6 z-50"
    haptic
    {...props}
  >
    {icon}
  </EnhancedButton>
);

export default EnhancedButton;