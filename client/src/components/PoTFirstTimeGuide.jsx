// client/src/components/PoTFirstTimeGuide.jsx - 中央定位版本
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryButton } from './EnhancedButton';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';

/**
 * PoT Mode 首次使用引导浮层 - 视窗中央版本
 * 简化实现：固定在屏幕中央，不依赖输入框位置
 */
const PoTFirstTimeGuide = ({
  isVisible = false,
  onDismiss,
  onStartTyping,
  isMobile = false,
  inputRef = null
}) => {
  const haptic = useHapticFeedback();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // 监听输入框的输入事件
  useEffect(() => {
    if (isVisible && inputRef?.current) {
      const inputElement = inputRef.current;
      
      const handleInput = () => {
        onStartTyping?.(dontShowAgain);
      };

      const handleFocus = () => {
        onStartTyping?.(dontShowAgain);
      };

      inputElement.addEventListener('input', handleInput);
      inputElement.addEventListener('focus', handleFocus);
      
      return () => {
        inputElement.removeEventListener('input', handleInput);
        inputElement.removeEventListener('focus', handleFocus);
      };
    }
  }, [isVisible, inputRef, onStartTyping, dontShowAgain]);

  const handleDismiss = () => {
    haptic.light();
    onDismiss?.(dontShowAgain);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {/* 遮罩层 */}
      <motion.div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => {
          // 点击遮罩层关闭
          if (e.target === e.currentTarget) {
            handleDismiss();
          }
        }}
      >
        {/* 引导弹窗 */}
        <motion.div
        className={`
            relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
            pot-first-guide-border
            ${isMobile ? 'mx-4 p-6 max-w-sm' : 'mx-8 p-8 max-w-md'}
        `}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* 发光边框效果 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-amber-400/20 blur-sm -z-10" />
          
          {/* 内容 */}
          <div className="relative">
            {/* 图标和标题 */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                className="text-3xl"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                💡
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
                PoT Mode ON.
              </h3>
            </div>

            {/* 引导文字 */}
            <div className="text-center mb-6">
              <p className={`
                text-gray-700 dark:text-gray-300 mb-4 leading-relaxed
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  直接输入问题即可，PoT Tutor 助你直达彼岸
                </span>
              </p>

              {/* 特性说明 */}
                <div className={`
                pot-first-guide-feature-bg rounded-lg p-4 mb-6
                border text-left
                `}>
                <div className="text-sm pot-first-guide-feature-text space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-base">🎯</span>
                    <span>引导式高效思维学习</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base">🔍</span>
                    <span>提供可信AI助学过程</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base">⚡</span>
                    <span>PoT专用智能体支持</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 不再显示选项 */}
            <div className={`
              bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-6
              border border-gray-200 dark:border-gray-700/50
            `}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => {
                    setDontShowAgain(e.target.checked);
                    haptic.light();
                  }}
                  className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded 
                           focus:ring-amber-500 focus:ring-2 dark:focus:ring-amber-600 
                           dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600
                           transition-colors duration-200"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 
                               group-hover:text-gray-800 dark:group-hover:text-gray-200
                               transition-colors duration-200">
                  不再显示此引导
                </span>
              </label>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center">
                <PrimaryButton
                onClick={handleDismiss}
                size={isMobile ? "md" : "md"}
                className="pot-first-guide-button px-8"
                >
                开始使用 PoT Mode
                </PrimaryButton>
            </div>
          </div>

          {/* 呼吸光晕效果 */}
          <motion.div
            className="absolute inset-0 rounded-2xl pot-first-guide-glow blur-xl -z-10"
            animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [0.98, 1.02, 0.98]
            }}
            transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
            }}
            />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PoTFirstTimeGuide;