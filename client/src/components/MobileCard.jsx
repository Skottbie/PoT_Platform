// src/components/MobileCard.jsx - 移动端优化的卡片组件
import { motion } from 'framer-motion';
import clsx from 'clsx';

const MobileCard = ({ 
  children, 
  className = '', 
  onClick,
  variant = 'default',
  padding = 'default',
  shadow = 'default',
  animated = true,
  ...props 
}) => {
  const baseStyles = `
    bg-white/80 dark:bg-gray-800/80
    backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50
    transition-all duration-200
  `;

  const variantStyles = {
    default: 'rounded-2xl',
    compact: 'rounded-xl',
    large: 'rounded-3xl',
    minimal: 'rounded-lg border-0 bg-transparent backdrop-blur-none',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-mobile',
    lg: 'shadow-mobile-lg',
    xl: 'shadow-mobile-xl',
  };

  const interactiveStyles = onClick ? `
    cursor-pointer
    hover:shadow-card-hover hover:scale-[1.02]
    active:scale-[0.98]
    touch-manipulation
  ` : '';

  const CardComponent = animated ? motion.div : 'div';
  const animationProps = animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
    whileTap: onClick ? { scale: 0.98 } : undefined,
  } : {};

  return (
    <CardComponent
      className={clsx(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        shadowStyles[shadow],
        interactiveStyles,
        className
      )}
      onClick={onClick}
      {...animationProps}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// 预设的卡片变体
export const TaskCard = ({ children, ...props }) => (
  <MobileCard
    variant="default"
    padding="default"
    shadow="default"
    className="border-l-4 border-l-blue-500"
    {...props}
  >
    {children}
  </MobileCard>
);

export const ClassCard = ({ children, ...props }) => (
  <MobileCard
    variant="default"
    padding="default"
    shadow="lg"
    className="hover:border-purple-200 dark:hover:border-purple-700"
    {...props}
  >
    {children}
  </MobileCard>
);

export const SubmissionCard = ({ children, ...props }) => (
  <MobileCard
    variant="compact"
    padding="sm"
    shadow="sm"
    className="border-l-4 border-l-green-500"
    {...props}
  >
    {children}
  </MobileCard>
);

export default MobileCard;