// client/src/components/PoTFirstTimeGuide.jsx - PoT Mode 首次使用引导
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryButton } from './EnhancedButton';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';

/**
 * PoT Mode 首次使用引导浮层
 * 在聊天输入框上方显示，带指向箭头和金色边框
 */
const PoTFirstTimeGuide = ({
  isVisible = false,
  onDismiss,
  onStartTyping,
  isMobile = false,
  inputRef = null
}) => {
  const haptic = useHapticFeedback();
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // 计算引导浮层位置
  useEffect(() => {
    if (isVisible && inputRef?.current) {
      const updatePosition = () => {
        const inputRect = inputRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        setPosition({
          top: inputRect.top + scrollTop - (isMobile ? 100 : 80),
          left: inputRect.left,
          width: inputRect.width
        });
      };

      updatePosition();
      
      // 监听窗口大小变化和滚动
      const handleResize = () => updatePosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }
  }, [isVisible, inputRef, isMobile]);

  // 监听输入框的输入事件
  useEffect(() => {
    if (isVisible && inputRef?.current) {
      const inputElement = inputRef.current;
      
      const handleInput = () => {
        onStartTyping?.();
      };

      const handleFocus = () => {
        onStartTyping?.();
      };

      inputElement.addEventListener('input', handleInput);
      inputElement.addEventListener('focus', handleFocus);
      
      return () => {
        inputElement.removeEventListener('input', handleInput);
        inputElement.removeEventListener('focus', handleFocus);
      };
    }
  }, [isVisible, inputRef, onStartTyping]);

  const handleDismiss = () => {
    haptic.light();
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-[1000] pointer-events-none"
        style={{
          top: position.top,
          left: position.left,
          width: position.width
        }}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          duration: 0.4 
        }}
      >
        {/* 引导内容卡片 */}
        <div className="relative">
          {/* 主要内容区域 */}
          <motion.div
            className={`
              bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
              border-2 border-amber-500/50 
              ${isMobile ? 'p-4 mx-2' : 'p-6'}
              relative pointer-events-auto
              backdrop-blur-md bg-white/95 dark:bg-gray-900/95
            `}
            initial={{ rotateX: -15, rotateY: 5 }}
            animate={{ rotateX: 0, rotateY: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* 发光边框效果 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-amber-400/20 blur-sm -z-10" />
            
            {/* 内容 */}
            <div className="relative">
              {/* 图标和标题 */}
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="text-2xl"
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
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  欢迎使用 PoT Mode！
                </h3>
              </div>

              {/* 引导文字 */}
              <p className={`
                text-gray-700 dark:text-gray-300 mb-4 leading-relaxed
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  直接输入问题即可，PoT Tutor 会帮助你直达彼岸
                </span>
              </p>

              {/* 特性说明 */}
              <div className={`
                bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4
                border border-amber-200 dark:border-amber-700/30
              `}>
                <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🎯</span>
                    <span>学习引导式思维过程</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🔍</span>
                    <span>教师可追踪学习过程</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">⚡</span>
                    <span>专用智能体协助</span>
                  </div>
                </div>
              </div>

              {/* 了解按钮 */}
              <div className="flex justify-end">
                <PrimaryButton
                  onClick={handleDismiss}
                  size={isMobile ? "sm" : "sm"}
                  variant="primary"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  了解了
                </PrimaryButton>
              </div>
            </div>
          </motion.div>

          {/* 指向箭头 */}
          <motion.div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-amber-500/80" />
          </motion.div>

          {/* 呼吸光晕效果 */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-amber-400/10 blur-xl"
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PoTFirstTimeGuide;