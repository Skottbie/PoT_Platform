// client/src/components/PoTPowerButton.jsx - PoT Mode 电源键开关
import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';

/**
 * PoT Mode 电源键开关组件
 * 支持四种界面模式的完美适配
 */
const PoTPowerButton = ({
  potEnabled = false,
  isActivating = false,
  onClick,
  mode = 'normal', // 'normal' | 'fullscreen'
  device = 'mobile', // 'mobile' | 'desktop' 
  showLabel = true,
  className = '',
  disabled = false
}) => {
  const haptic = useHapticFeedback();

  // 处理点击事件
  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || isActivating) return;
    
    haptic.medium();
    onClick?.();
  }, [disabled, isActivating, onClick, haptic]);

  // 获取按钮尺寸
  const getButtonSize = () => {
    if (device === 'mobile') {
      return mode === 'fullscreen' ? 'w-8 h-8' : 'w-8 h-8'; // 32px
    } else {
      return 'w-7 h-7'; // 28px 桌面端
    }
  };

  // 获取容器样式
  const getContainerClass = () => {
    const baseClass = "flex items-center transition-all duration-200";
    
    if (mode === 'normal') {
      // 非全屏模式：左侧文字 + 右侧电源键
      return `${baseClass} justify-between w-full`;
    } else {
      // 全屏模式：纯电源键按钮
      return `${baseClass} ${className}`;
    }
  };

  // 电源键按钮样式
    const getButtonClass = () => {
    const baseClass = `
        ${getButtonSize()}
        rounded-full border-2 transition-all duration-200 
        flex items-center justify-center
        relative overflow-hidden aigc-native-button
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
    `;

    if (potEnabled) {
        // ON 状态：使用统一配色
        return `${baseClass} pot-power-button-on`;
    } else {
        // OFF 状态：统一灰色
        return `${baseClass} pot-power-button-off`;
    }
    };

    // 替换激活光晕效果：
    {isActivating && (
    <motion.div
        className="absolute inset-0 rounded-full pot-power-activation-light"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
    />
    )}

    // 替换ON状态发光效果：
    {potEnabled && !isActivating && (
    <motion.div
        className="absolute inset-0 rounded-full pot-power-glow-light"
        initial={{ opacity: 0 }}
        animate={{ 
        opacity: [0.5, 1, 0.5],
        scale: [1, 1.1, 1]
        }}
        exit={{ opacity: 0 }}
        transition={{ 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
        }}
    />
    )}

  // 电源图标颜色
  const getIconColor = () => {
    return potEnabled ? 'text-white' : 'text-gray-100 dark:text-gray-300';
  };

  // 标签文字样式
  const getLabelClass = () => {
    const baseClass = "font-medium transition-colors duration-200";
    
    if (mode === 'normal') {
      return `${baseClass} text-base text-gray-700 dark:text-gray-300`;
    } else {
      return `${baseClass} text-sm text-gray-600 dark:text-gray-400`;
    }
  };

  return (
    <div className={getContainerClass()}>
      {/* 左侧标签文字（仅非全屏模式 + showLabel 时显示） */}
      {mode === 'normal' && showLabel && (
        <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <span className={`${getLabelClass()} ${potEnabled ? 'pot-mode-label-text' : ''}`}>
            PoT Mode
            </span>
        </div>
        )}

      {/* 电源键按钮 */}
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled || isActivating}
        className={getButtonClass()}
        whileTap={disabled || isActivating ? {} : { scale: 0.95 }}
        transition={{ duration: 0.1 }}
        title={potEnabled ? "关闭 PoT Mode" : "开启 PoT Mode"}
      >
        {/* 激活时的光晕扩散效果 */}
        <AnimatePresence>
          {isActivating && (
            <motion.div
              className="absolute inset-0 rounded-full bg-amber-400/50"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* 电源图标 */}
        <motion.div
          className={`${getIconColor()} text-base`}
          animate={isActivating ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          ⏻
        </motion.div>

        {/* ON 状态时的发光效果 */}
        <AnimatePresence>
          {potEnabled && !isActivating && (
            <motion.div
              className="absolute inset-0 rounded-full bg-amber-400/20"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default PoTPowerButton;