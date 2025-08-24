// src/components/Button.jsx
import React from 'react';
import clsx from 'clsx';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-xl 
    transition-all duration-200 select-none relative overflow-hidden
    active:scale-95 disabled:active:scale-100
    focus:outline-none focus:ring-2 focus:ring-offset-2
    touch-manipulation
  `;

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-base min-h-[40px]', // 调整中等尺寸
    lg: 'px-6 py-3 text-lg min-h-[44px]', // 调整大尺寸
  };

  // 其他代码保持不变...
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-blue-500 to-purple-600
      text-white font-semibold
      shadow-lg shadow-blue-500/25
      hover:shadow-xl hover:shadow-purple-500/30
      focus:ring-blue-500/50
      border-0
      before:absolute before:inset-0 before:bg-gradient-to-r 
      before:from-blue-400 before:to-purple-500 before:opacity-0 
      before:transition-opacity before:duration-200
      hover:before:opacity-100
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:before:opacity-0
    `,
    secondary: `
      bg-white/90 dark:bg-gray-800/90
      text-gray-700 dark:text-gray-200 font-medium
      border border-gray-200 dark:border-gray-700
      shadow-md shadow-gray-900/5
      backdrop-blur-xl
      hover:bg-white dark:hover:bg-gray-700
      hover:shadow-lg
      focus:ring-gray-500/50
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-rose-600
      text-white font-semibold
      shadow-lg shadow-red-500/25
      hover:shadow-xl hover:shadow-rose-500/30
      focus:ring-red-500/50
      border-0
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    ghost: `
      bg-transparent
      text-gray-600 dark:text-gray-300 font-medium
      border border-gray-300/50 dark:border-gray-600/50
      hover:bg-gray-50 dark:hover:bg-gray-800/50
      hover:border-gray-400 dark:hover:border-gray-500
      focus:ring-gray-500/50
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    warning: `
      bg-gradient-to-r from-orange-500 to-amber-600
      text-white font-semibold
      shadow-lg shadow-orange-500/25
      hover:shadow-xl hover:shadow-amber-500/30
      focus:ring-orange-500/50
      border-0
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={clsx(
        'flex items-center gap-2',
        loading ? 'opacity-0' : 'opacity-100'
      )}>
        {children}
      </span>
    </button>
  );
}