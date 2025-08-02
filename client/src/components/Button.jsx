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
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 select-none';
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles = {
    primary: `
        bg-gradient-to-r from-blue-500 to-purple-500
        text-white shadow-md
        hover:shadow-lg hover:scale-[1.02]
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
        bg-gray-200/40 dark:bg-gray-700/40
        text-gray-800 dark:text-gray-200
        border border-gray-300/50 dark:border-gray-600/50
        backdrop-blur-xl
        hover:bg-gray-300/60 dark:hover:bg-gray-600/60
        hover:shadow-lg hover:scale-[1.02]
        active:scale-95
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
    `,
    danger: `
        bg-red-500/90 text-white
        hover:bg-red-500 hover:shadow-lg
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
    `,
    ghost: `
        bg-transparent text-gray-600 dark:text-gray-300
        hover:text-blue-500 dark:hover:text-blue-400
        hover:bg-gray-100/50 dark:hover:bg-gray-700/50
        active:scale-95
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
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      )}
      {children}
    </button>
  );
}
