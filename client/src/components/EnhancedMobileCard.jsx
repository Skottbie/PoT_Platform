// src/components/EnhancedMobileCard.jsx - 新建文件
import { motion } from 'framer-motion';
import clsx from 'clsx';

const EnhancedMobileCard = ({ 
  children, 
  className = '', 
  onClick,
  variant = 'default',
  size = 'default',
  shadow = 'default',
  animated = true,
  interactive = false,
  gradient = false,
  glass = false,
  ...props 
}) => {
  // 基础样式
  const baseStyles = `
    relative overflow-hidden
    transition-all duration-300 ease-out
    touch-manipulation
  `;

  // 变体样式
  const variantStyles = {
    default: `
      bg-white dark:bg-gray-800 
      border border-gray-200/60 dark:border-gray-700/60
      rounded-mobile-xl
    `,
    elevated: `
      bg-white dark:bg-gray-800 
      border-0
      rounded-mobile-2xl
    `,
    outlined: `
      bg-transparent 
      border-2 border-gray-300 dark:border-gray-600
      rounded-mobile-xl
    `,
    task: `
      bg-white dark:bg-gray-800 
      border border-gray-200/60 dark:border-gray-700/60
      rounded-mobile-xl
      border-l-4 border-l-blue-500
    `,
    success: `
      bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20
      border border-green-200/60 dark:border-green-700/60
      rounded-mobile-xl
      border-l-4 border-l-green-500
    `,
    warning: `
      bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20
      border border-orange-200/60 dark:border-orange-700/60
      rounded-mobile-xl
      border-l-4 border-l-orange-500
    `,
    error: `
      bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20
      border border-red-200/60 dark:border-red-700/60
      rounded-mobile-xl
      border-l-4 border-l-red-500
    `,
    info: `
      bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20
      border border-blue-200/60 dark:border-blue-700/60
      rounded-mobile-xl
      border-l-4 border-l-blue-500
    `,
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'p-3',
    default: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
    xl: 'p-6 sm:p-8',
  };

  // 阴影样式
  const shadowStyles = {
    none: '',
    sm: 'shadow-card',
    default: 'shadow-mobile',
    lg: 'shadow-mobile-lg',
    xl: 'shadow-mobile-xl',
    float: 'shadow-float',
  };

  // 交互样式
  const interactiveStyles = (onClick || interactive) ? `
    cursor-pointer
    hover:shadow-mobile-lg hover:-translate-y-0.5
    active:shadow-card active:translate-y-0 active:scale-[0.98]
    select-none-touch
  ` : '';

  // 玻璃形态样式
  const glassStyles = glass ? `
    glass backdrop-blur-xl
    bg-white/80 dark:bg-gray-800/80
    border-white/20 dark:border-gray-700/30
  ` : '';

  // 渐变样式
  const gradientStyles = gradient ? `
    bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30
    dark:from-gray-800 dark:via-blue-900/10 dark:to-purple-900/10
  ` : '';

  const CardComponent = animated ? motion.div : 'div';
  const animationProps = animated ? {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { 
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] // 自定义缓动函数
    },
    whileTap: (onClick || interactive) ? { 
      scale: 0.98,
      transition: { duration: 0.1 }
    } : undefined,
    layout: true,
  } : {};

  return (
    <CardComponent
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        shadowStyles[shadow],
        interactiveStyles,
        glassStyles,
        gradientStyles,
        className
      )}
      onClick={onClick}
      {...animationProps}
      {...props}
    >
      {children}
      
      {/* 悬停时的微妙光效 */}
      {(onClick || interactive) && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-mobile-xl" />
        </div>
      )}
    </CardComponent>
  );
};

// 预设的专用卡片组件
export const TaskCard = ({ children, status = 'default', urgent = false, ...props }) => {
  const getVariant = () => {
    if (urgent) return 'error';
    switch (status) {
      case 'completed': return 'success';
      case 'overdue': return 'error';
      case 'warning': return 'warning';
      case 'pending': return 'info';
      default: return 'task';
    }
  };

  return (
    <EnhancedMobileCard
      variant={getVariant()}
      shadow="default"
      interactive
      {...props}
    >
      {children}
    </EnhancedMobileCard>
  );
};

export const ClassCard = ({ children, ...props }) => (
  <EnhancedMobileCard
    variant="elevated"
    shadow="lg"
    gradient
    interactive
    className="hover:border-purple-200 dark:hover:border-purple-700/50"
    {...props}
  >
    {children}
  </EnhancedMobileCard>
);

export const SubmissionCard = ({ children, status = 'default', ...props }) => {
  const getVariant = () => {
    switch (status) {
      case 'submitted': return 'success';
      case 'late': return 'warning';
      case 'missing': return 'error';
      default: return 'info';
    }
  };

  return (
    <EnhancedMobileCard
      variant={getVariant()}
      size="sm"
      shadow="sm"
      interactive
      {...props}
    >
      {children}
    </EnhancedMobileCard>
  );
};

export const FormCard = ({ children, ...props }) => (
  <EnhancedMobileCard
    variant="default"
    shadow="lg"
    glass
    className="backdrop-blur-xl"
    {...props}
  >
    {children}
  </EnhancedMobileCard>
);

export const StatsCard = ({ children, color = 'blue', ...props }) => {
  const colorVariants = {
    blue: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/60 dark:border-blue-700/60',
    green: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/60 dark:border-green-700/60',
    orange: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/60 dark:border-orange-700/60',
    purple: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200/60 dark:border-purple-700/60',
  };

  return (
    <EnhancedMobileCard
      variant="default"
      shadow="default"
      className={`${colorVariants[color]} border rounded-mobile-xl`}
      {...props}
    >
      {children}
    </EnhancedMobileCard>
  );
};

// 通知卡片
export const NotificationCard = ({ children, type = 'info', ...props }) => (
  <EnhancedMobileCard
    variant={type}
    size="sm"
    shadow="sm"
    animated
    className="border-l-4"
    {...props}
  >
    {children}
  </EnhancedMobileCard>
);

// 浮动操作卡片
export const FloatingCard = ({ children, ...props }) => (
  <EnhancedMobileCard
    variant="elevated"
    shadow="float"
    glass
    className="fixed bottom-4 right-4 z-50"
    {...props}
  >
    {children}
  </EnhancedMobileCard>
);

export default EnhancedMobileCard;