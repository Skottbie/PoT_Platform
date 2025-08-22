// client/src/components/PoTPowerButton.jsx - 更新后的 PoT Mode 电源键开关
import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Power } from 'lucide-react';
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

  // 电源键按钮样式 - 提升质感
  const getButtonClass = () => {
    const baseClass = `
      ${getButtonSize()}
      rounded-full border-2 transition-all duration-200 
      flex items-center justify-center
      relative overflow-hidden aigc-native-button
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:scale-105'}
    `;

    if (potEnabled) {
      // ON 状态：提升版质感
      return `${baseClass} pot-power-button-on shadow-lg ring-2 ring-amber-300 dark:ring-amber-600 ring-opacity-50`;
    } else {
      // OFF 状态：提升版质感
      return `${baseClass} pot-power-button-off shadow-inner border-gray-300 dark:border-gray-500`;
    }
  };

  // 电源图标颜色
  const getIconColor = () => {
    return potEnabled ? 'text-white drop-shadow-sm' : 'text-gray-600 dark:text-gray-300';
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
          <BrainCircuit className={`w-5 h-5 strokeWidth={1.5} ${
            potEnabled 
              ? 'text-amber-600 dark:text-purple-400' 
              : 'text-purple-600 dark:text-purple-400'
          }`} />
          <span className={`${getLabelClass()} ${potEnabled ? 'pot-mode-label-text' : ''}`}>
            PoT-Mode
          </span>
          {/* Beta 标识 - 纯文字样式 */}
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 ml-1">
            beta
          </span>
        </div>
      )}

      {/* 电源键按钮 - 提升质感版本 */}
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled || isActivating}
        className={getButtonClass()}
        whileTap={disabled || isActivating ? {} : { scale: 0.95 }}
        whileHover={disabled || isActivating ? {} : { scale: 1.05 }}
        transition={{ duration: 0.1 }}
        title={potEnabled ? "关闭 PoT-Mode" : "开启 PoT-Mode"}
      >
        {/* 激活时的光晕扩散效果 */}
        <AnimatePresence>
          {isActivating && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-50"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* 电源图标 - 使用 Lucide Power 图标 */}
        <motion.div
          className={getIconColor()}
          animate={isActivating ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Power className="w-4 h-4" strokeWidth={2} />
        </motion.div>

        {/* ON 状态时的发光效果 - 提升版 */}
        <AnimatePresence>
          {potEnabled && !isActivating && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.05, 1]
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