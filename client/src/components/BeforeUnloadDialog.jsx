// 完全替换 src/components/BeforeUnloadDialog.jsx 的内容

import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryButton, SecondaryButton, WarningButton } from './EnhancedButton';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';

const BeforeUnloadDialog = ({
  isOpen,
  hasFile,
  hasImages, // 🆕 新增图片检测参数
  onSaveAndLeave,
  onLeaveWithoutSave,
  onCancel
}) => {
  const haptic = useHapticFeedback();

  const handleSaveAndLeave = () => {
    try {
      if (haptic && typeof haptic.success === 'function') {
        haptic.success();
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
    onSaveAndLeave();
  };

  const handleLeaveWithoutSave = () => {
    try {
      if (haptic && typeof haptic.medium === 'function') {
        haptic.medium();
      } else if (haptic && typeof haptic.light === 'function') {
        haptic.light();
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
    onLeaveWithoutSave();
  };

  const handleCancel = () => {
    try {
      if (haptic && typeof haptic.light === 'function') {
        haptic.light();
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    退出任务界面
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {(hasFile || hasImages)
                      ? '是否保存为草稿？文件/图片需要重新上传。'
                      : '是否保存为草稿？'
                    }
                  </p>
                </div>
              </div>

              {/* 🔧 修复：文件提示（保持原有逻辑） */}
              {hasFile && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>文件不会保存到草稿中，下次需要重新上传</span>
                  </div>
                </div>
              )}

              {/* 🆕 新增：图片提示 */}
              {hasImages && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>图片不会保存到草稿中，下次需要重新上传</span>
                  </div>
                </div>
              )}
            </div>

            {/* 按钮区域 */}
            <div className="px-6 pb-6 flex flex-col gap-3">
              <PrimaryButton
                onClick={handleSaveAndLeave}
                className="w-full"
              >
                保存草稿并离开
              </PrimaryButton>
              
              <div className="flex gap-3">
                <SecondaryButton
                  onClick={handleCancel}
                  className="flex-1"
                >
                  取消
                </SecondaryButton>
                <WarningButton
                  onClick={handleLeaveWithoutSave}
                  className="flex-1"
                >
                  不保存
                </WarningButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BeforeUnloadDialog;