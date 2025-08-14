// src/components/DraftSaveIndicator.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from './EnhancedButton';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';

const DraftSaveIndicator = ({ 
  saveStatus, 
  onManualSave,
  className = ''
}) => {
  const haptic = useHapticFeedback();

  const handleManualSave = () => {
    haptic.light();
    onManualSave();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 状态指示 */}
      <AnimatePresence mode="wait">
        {saveStatus === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3"
            >
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.div>
            <span className="font-medium">保存中</span>
          </motion.div>
        )}

        {saveStatus === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
              className="w-3 h-3"
            >
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <span className="font-medium">已保存</span>
          </motion.div>
        )}

        {saveStatus === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
              className="w-3 h-3"
            >
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
            <span className="font-medium">保存失败</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 手动保存按钮 - 使用 SecondaryButton 保持样式一致 */}
      <motion.button
        onClick={handleManualSave}
        disabled={saveStatus === 'saving'}
        title="手动保存草稿"
        className={`
          relative p-2.5 rounded-lg border transition-all duration-200
          ${saveStatus === 'saved' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
          ${saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300 dark:hover:border-gray-500'}
          shadow-sm hover:shadow-md
        `}
        whileTap={{ scale: saveStatus === 'saving' ? 1 : 0.95 }}
        whileHover={{ scale: saveStatus === 'saving' ? 1 : 1.02 }}
      >
        <motion.div
          className="w-4 h-4"
          animate={saveStatus === 'saving' ? { rotate: 360 } : { rotate: 0 }}
          transition={saveStatus === 'saving' ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          {saveStatus === 'saving' ? (
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg 
              className="w-full h-full" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
              />
            </svg>
          )}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default DraftSaveIndicator;