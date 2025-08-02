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
    bg-gradient-to-r from-blue-400 to-purple-500
    text-white
    shadow-md shadow-blue-500/20
    ring-1 ring-white/20
    backdrop-blur-lg
    hover:brightness-110 hover:shadow-lg hover:shadow-purple-500/30
    active:scale-95
    transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  secondary: `
    bg-white/20 dark:bg-white/10
    text-gray-900 dark:text-gray-200
    shadow-sm shadow-black/10 dark:shadow-white/5
    ring-1 ring-black/10 dark:ring-white/10
    backdrop-blur-xl
    hover:bg-white/30 dark:hover:bg-white/20
    hover:shadow-md hover:scale-[1.02]
    active:scale-95
    transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  danger: `
    bg-gradient-to-r from-rose-400 to-red-500
    text-white
    shadow-md shadow-red-500/30
    ring-1 ring-white/20
    backdrop-blur-lg
    hover:brightness-110 hover:shadow-lg hover:shadow-red-500/40
    active:scale-95
    transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent
    text-gray-600 dark:text-gray-300
    hover:text-blue-500 dark:hover:text-blue-400
    hover:bg-gray-500/10 dark:hover:bg-gray-500/10
    backdrop-blur-sm
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
