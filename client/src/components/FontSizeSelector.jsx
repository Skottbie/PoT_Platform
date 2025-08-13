// client/src/components/FontSizeSelector.jsx - 移动端优化版

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FontSizeManager, useFontSize } from '../utils/fontSizeUtils';
import { useHapticFeedback, useDeviceDetection } from '../hooks/useDeviceDetetion';
import Button from './Button';

const FontSizeSelector = ({ isOpen, onClose }) => {
  const { 
    currentSize, 
    allSizes, 
    recommendedSize, 
    deviceType,
    changeSize, 
    resetSize 
  } = useFontSize();
  
  const haptic = useHapticFeedback();
  const device = useDeviceDetection();
  const [previewSize, setPreviewSize] = useState(currentSize);

  // 移动端简化预览文本
  const getPreviewText = () => {
    if (device.isMobile) {
      return {
        user: "测试问题",
        assistant: "AI回复示例 **粗体** `代码`"
      };
    }
    
    // 桌面端稍微详细一些
    return {
      user: "请帮我分析一下这个问题",
      assistant: "当然可以！让我来帮你分析。从多个角度来看：\n\n**核心要素**\n- 问题分析\n- 解决方案\n\n`代码示例`会这样显示。"
    };
  };

  const previewText = getPreviewText();

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
    setPreviewSize(currentSize);
    onClose();
  }, [currentSize, haptic, onClose]);

  // 支持滑动关闭（移动端体验）
  const handleSwipeDown = useCallback((event, info) => {
    if (info.offset.y > 100 && info.velocity.y > 500) {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  const previewConfig = FontSizeManager.getSizeConfig(previewSize);
  const isMobile = device.isMobile;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ 
            scale: isMobile ? 1 : 0.95, 
            opacity: 0, 
            y: isMobile ? '100%' : 20 
          }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0 
          }}
          exit={{ 
            scale: isMobile ? 1 : 0.95, 
            opacity: 0, 
            y: isMobile ? '100%' : 20 
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={isMobile ? handleSwipeDown : undefined}
            className={`
                bg-white dark:bg-gray-800 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 
                w-full overflow-hidden flex flex-col
                ${isMobile 
                ? 'max-w-none rounded-b-3xl' 
                : 'max-w-md mx-4 rounded-2xl'
                }
            `}
            style={{
                // 🔧 关键修复：使用灵活的高度策略，确保内容不被截断
                height: isMobile ? '85vh' : 'auto',
                maxHeight: isMobile ? '85vh' : '90vh', // 桌面端提高到90vh
                minHeight: isMobile ? '70vh' : 'auto',
            }}
            >
            {/* 移动端拖拽指示器 */}
            {isMobile && (
                <div className="flex justify-center py-3 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>
            )}

            {/* 头部 - 固定高度 */}
            <div className={`flex-shrink-0 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
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
                        {deviceType === 'mobile' ? '手机端' : deviceType === 'tablet' ? '平板端' : '桌面端'}适配
                    </p>
                    </div>
                </div>
                
                {!isMobile && (
                    <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </button>
                )}
                </div>
            </div>

            {/* 🔧 字号选择区域 - 固定内容，自适应高度 */}
            <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
                {/* 字号选择网格 */}
                <div className={`grid gap-3 mb-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {allSizes.map((sizeConfig) => (
                    <motion.button
                    key={sizeConfig.value}
                    onClick={() => handleSizeSelect(sizeConfig.value)}
                    className={`relative rounded-xl border-2 transition-all duration-200 ${
                        previewSize === sizeConfig.value
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    } ${isMobile ? 'p-3' : 'p-4'}`}
                    whileTap={{ scale: 0.95 }}
                    >
                    <div className="text-center">
                        <div 
                        className="font-medium text-gray-900 dark:text-gray-100 mb-1"
                        style={{ fontSize: `${Math.min(sizeConfig.size, isMobile ? 18 : 20)}px` }}
                        >
                        文字
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sizeConfig.label}
                        </div>
                        {!isMobile && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            {sizeConfig.size}px
                        </div>
                        )}
                    </div>

                    {sizeConfig.value === recommendedSize && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        推荐
                        </div>
                    )}

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
                className="w-full mb-2 py-2 px-4 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                恢复推荐设置
                </button>
            </div>

            {/* 🔧 预览区域 - 关键修复：灵活高度策略 */}
            <div className={`
                ${isMobile ? 'flex-1 min-h-[120px]' : 'flex-shrink-0'} 
                flex flex-col bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200/50 dark:border-gray-700/50 
                ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}
            `}>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                预览效果
                </div>
                
                <div 
                className={`
                    ${isMobile ? 'flex-1' : 'h-32'} 
                    bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50 
                    ${isMobile ? 'overflow-hidden' : 'overflow-y-auto'}
                `}
                style={{
                    fontSize: `${previewConfig.size}px`,
                    lineHeight: previewConfig.size <= 16 ? '1.6' : '1.5',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    WebkitOverflowScrolling: isMobile ? 'auto' : 'touch',
                    touchAction: isMobile ? 'none' : 'pan-y',
                }}
                >
                {/* 用户消息预览 */}
                <div className="flex justify-end mb-1">
                    <div className={`bg-blue-500 text-white rounded-xl px-2 py-1 ${isMobile ? 'max-w-[70%]' : 'max-w-[85%]'}`}>
                    {previewText.user}
                    </div>
                </div>

                {/* AI回复预览 */}
                <div className="flex justify-start">
                    <div className={`bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-2 py-1 ${isMobile ? 'max-w-[70%]' : 'max-w-[85%]'}`}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                        p: ({ children }) => (
                            <div className={isMobile ? "line-clamp-3" : "whitespace-pre-wrap"}>
                            {children}
                            </div>
                        ),
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        code: ({ children }) => (
                            <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-sm font-mono">
                            {children}
                            </code>
                        ),
                        }}
                    >
                        {previewText.assistant}
                    </ReactMarkdown>
                    </div>
                </div>
                </div>
            </div>

                {/* 底部按钮区域 - 缩小按钮 */}
                <div className={`flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200/50 dark:border-gray-700/50 ${isMobile ? 'px-4 py-3 pb-safe' : 'px-6 py-4'}`}>
                <div className="flex gap-2"> {/* 减少gap */}
                    <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="flex-1"
                    size={isMobile ? "md" : "sm"} // 缩小按钮尺寸
                    >
                    取消
                    </Button>
                    <Button
                    variant="primary"
                    onClick={handleConfirm}
                    className="flex-1"
                    size={isMobile ? "md" : "sm"} // 缩小按钮尺寸
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