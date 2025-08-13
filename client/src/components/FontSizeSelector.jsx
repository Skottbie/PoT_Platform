// client/src/components/FontSizeSelector.jsx - 字号选择器组件

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontSizeManager, useFontSize } from '../utils/fontSizeUtils';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';
import Button from './Button';

const FontSizeSelector = ({ isOpen, onClose }) => {
  const { currentSize, allSizes, recommendedSize, changeSize, resetSize } = useFontSize();
  const haptic = useHapticFeedback();
  const [previewSize, setPreviewSize] = useState(currentSize);

  // 预览文本内容
  const previewText = {
    user: "请帮我分析一下这个问题",
    assistant: "当然可以！让我来帮你分析这个问题。从多个角度来看，我们需要考虑以下几个方面：\n\n1. **问题的核心要素**\n2. 相关的背景信息\n3. 可能的解决方案\n\n```javascript\nfunction analyzeData(input) {\n  return input.map(item => {\n    return processItem(item);\n  });\n}\n```\n\n这样的分析方法能够帮助我们更好地理解问题的本质。"
  };

  const handleSizeSelect = useCallback((sizeKey) => {
    haptic.light();
    setPreviewSize(sizeKey);
  }, [haptic]);

  const handleConfirm = useCallback(() => {
    if (changeSize(previewSize)) {
      haptic.success();
      onClose();
    } else {
      haptic.error();
    }
  }, [previewSize, changeSize, haptic, onClose]);

  const handleReset = useCallback(() => {
    haptic.medium();
    const recommended = resetSize();
    setPreviewSize(recommended);
  }, [resetSize, haptic]);

  const handleClose = useCallback(() => {
    haptic.light();
    setPreviewSize(currentSize); // 恢复原始预览
    onClose();
  }, [currentSize, haptic, onClose]);

  if (!isOpen) return null;

  const previewConfig = FontSizeManager.getSizeConfig(previewSize);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-md mx-4 overflow-hidden"
        >
          {/* 头部 */}
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">𝐀𝐚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    字号设置
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    选择适合的阅读字号
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 字号选择 */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {allSizes.map((sizeConfig) => (
                <motion.button
                  key={sizeConfig.value}
                  onClick={() => handleSizeSelect(sizeConfig.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                    previewSize === sizeConfig.value
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <div 
                      className="font-medium text-gray-900 dark:text-gray-100 mb-1"
                      style={{ fontSize: `${sizeConfig.size}px` }}
                    >
                      文字
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {sizeConfig.label}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {sizeConfig.size}px
                    </div>
                  </div>

                  {/* 推荐标签 */}
                  {sizeConfig.value === recommendedSize && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      推荐
                    </div>
                  )}

                  {/* 选中指示器 */}
                  {previewSize === sizeConfig.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* 重置按钮 */}
            <button
              onClick={handleReset}
              className="w-full mb-4 py-2 px-4 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              恢复推荐设置
            </button>
          </div>

          {/* 预览区域 */}
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              字号预览效果
            </div>
            
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto border border-gray-200/50 dark:border-gray-700/50"
              style={{
                fontSize: `${previewConfig.size}px`,
                lineHeight: previewConfig.size <= 16 ? '1.6' : '1.5',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            >
              {/* 用户消息预览 */}
              <div className="flex justify-end mb-3">
                <div className="max-w-[85%] bg-blue-500 text-white rounded-2xl rounded-br-md px-3 py-2">
                  {previewText.user}
                </div>
              </div>

              {/* AI回复预览 */}
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md px-3 py-2">
                  <div className="whitespace-pre-wrap">
                    {previewText.assistant.split('```')[0]}
                  </div>
                  
                  {/* 代码块预览 */}
                  <div 
                    className="mt-2 bg-gray-800 dark:bg-gray-900 text-green-400 rounded-lg p-2 font-mono overflow-x-auto"
                    style={{
                      fontSize: `${Math.round(previewConfig.size * 0.9)}px`,
                      lineHeight: '1.4'
                    }}
                  >
                    {previewText.assistant.split('```')[1]?.replace('javascript\n', '') || ''}
                  </div>
                  
                  <div className="mt-2">
                    {previewText.assistant.split('```')[2]}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                className="flex-1"
              >
                应用设置
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FontSizeSelector;