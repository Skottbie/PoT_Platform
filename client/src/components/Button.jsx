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
  bg-white/5 dark:bg-white/5
  text-gray-700 dark:text-gray-200
  border border-gray-300/40 dark:border-gray-600/40
  shadow-sm
  backdrop-blur-sm
  hover:bg-white/10 dark:hover:bg-white/10
  hover:border-gray-400/60 dark:hover:border-gray-500/60
  hover:text-gray-900 dark:hover:text-white
  hover:shadow-md
  active:scale-95
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-200
`,
  warning: `
  bg-gradient-to-r from-orange-500 to-amber-600
  text-white
  shadow-md shadow-orange-500/25
  ring-1 ring-white/20
  backdrop-blur-lg
  hover:brightness-110 hover:shadow-lg hover:shadow-orange-500/35
  active:scale-95
  transition-all
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
