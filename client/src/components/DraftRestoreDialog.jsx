// src/components/DraftRestoreDialog.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from './EnhancedButton';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';

const DraftRestoreDialog = ({ 
  isOpen, 
  draftData, 
  onRestore, 
  onIgnore 
}) => {
  const haptic = useHapticFeedback();

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  const handleRestore = () => {
    haptic.success();
    onRestore();
  };

  const handleIgnore = () => {
    haptic.light();
    onIgnore();
  };

  if (!draftData) return null;

  const hasContent = !!(draftData.content?.trim());
  const hasImages = !!(draftData.images?.length > 0);
  const hasFile = !!(draftData.fileInfo?.hasFile);
  const hasAIGC = !!(draftData.aigcLog?.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleIgnore}
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
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    发现草稿内容
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    保存于 {formatTime(draftData.lastSaved)}
                  </p>
                </div>
              </div>

              {/* 内容预览 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                {hasContent && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      文本内容：{draftData.content.length} 字符
                    </span>
                  </div>
                )}

                {hasImages && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      {draftData.images.length} 张图片
                    </span>
                  </div>
                )}

                {hasAIGC && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">
                      AIGC 对话记录
                    </span>
                  </div>
                )}

                {hasFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-orange-600 dark:text-orange-400">
                      文件需重新上传：{draftData.fileInfo.fileName}
                    </span>
                  </div>
                )}

                {/* 🆕 新增：图片显示逻辑 */}
                {draftData?.images?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-orange-600 dark:text-orange-400">
                      图片需重新上传 ({draftData.images.length} 张)
                    </span>
                  </div>
                )}

                {!hasContent && !hasImages && !hasAIGC && !hasFile && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    空草稿
                  </div>
                )}
              </div>
            </div>

            {/* 按钮区域 */}
            <div className="px-6 pb-6 flex gap-3">
              <SecondaryButton
                onClick={handleIgnore}
                className="flex-1"
              >
                忽略
              </SecondaryButton>
              <PrimaryButton
                onClick={handleRestore}
                className="flex-1"
              >
                恢复草稿
              </PrimaryButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DraftRestoreDialog;