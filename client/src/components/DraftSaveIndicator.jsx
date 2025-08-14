// src/components/DraftSaveIndicator.jsx
import { motion, AnimatePresence } from 'framer-motion';
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

  // 获取按钮状态样式
  const getButtonStyles = () => {
    const baseStyles = `
      relative p-3 rounded-xl border-2 transition-all duration-300 ease-out
      shadow-sm backdrop-blur-sm overflow-hidden group
    `;

    switch (saveStatus) {
      case 'saving':
        return `${baseStyles} 
          bg-blue-50/80 dark:bg-blue-900/20 
          border-blue-200 dark:border-blue-700 
          text-blue-600 dark:text-blue-400
          cursor-not-allowed opacity-90
        `;
      case 'saved':
        return `${baseStyles}
          bg-green-50/80 dark:bg-green-900/20 
          border-green-200 dark:border-green-700 
          text-green-600 dark:text-green-400
          shadow-md
        `;
      case 'error':
        return `${baseStyles}
          bg-red-50/80 dark:bg-red-900/20 
          border-red-200 dark:border-red-700 
          text-red-600 dark:text-red-400
        `;
      default: // idle
        return `${baseStyles}
          bg-white/90 dark:bg-gray-800/90 
          border-gray-200 dark:border-gray-600 
          text-gray-600 dark:text-gray-400
          hover:bg-gray-50 dark:hover:bg-gray-700/80
          hover:border-gray-300 dark:hover:border-gray-500
          hover:shadow-md hover:text-gray-700 dark:hover:text-gray-300
        `;
    }
  };

  // 获取图标组件
  const getIcon = () => {
    const iconClass = "w-5 h-5 transition-all duration-300";
    
    switch (saveStatus) {
      case 'saving':
        return (
          <motion.div
            className={iconClass}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.div>
        );
      case 'saved':
        return (
          <motion.div
            className={iconClass}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            className={iconClass}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.div>
        );
      default: // idle
        return (
          <motion.div
            className={`${iconClass} group-hover:scale-110`}
            whileHover={{ rotate: -5 }}
            transition={{ duration: 0.2 }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </motion.div>
        );
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving': return '保存中';
      case 'saved': return '已保存';
      case 'error': return '保存失败';
      default: return null;
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 状态指示文本 */}
      <AnimatePresence mode="wait">
        {getStatusText() && (
          <motion.div
            key={saveStatus}
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            {/* 状态指示点 */}
            <motion.div
              className={`w-2 h-2 rounded-full ${
                saveStatus === 'saved' 
                  ? 'bg-green-500' 
                  : saveStatus === 'saving'
                  ? 'bg-blue-500' 
                  : 'bg-red-500'
              }`}
              animate={saveStatus === 'saving' ? { 
                scale: [1, 1.3, 1],
                opacity: [1, 0.6, 1]
              } : {}}
              transition={saveStatus === 'saving' ? { 
                duration: 1.5, 
                repeat: Infinity 
              } : {}}
            />
            
            {/* 状态文本 */}
            <span className={`text-sm font-medium ${
              saveStatus === 'saved' 
                ? 'text-green-600 dark:text-green-400' 
                : saveStatus === 'saving'
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {getStatusText()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主保存按钮 */}
      <motion.button
        onClick={handleManualSave}
        disabled={saveStatus === 'saving'}
        className={getButtonStyles()}
        whileHover={saveStatus !== 'saving' ? { 
          scale: 1.02,
          y: -1,
        } : {}}
        whileTap={saveStatus !== 'saving' ? { 
          scale: 0.95,
          y: 0,
        } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        title={saveStatus === 'saving' ? '正在保存...' : '手动保存草稿'}
      >
        {/* 背景光效 */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className={`absolute inset-0 rounded-xl ${
            saveStatus === 'saved' 
              ? 'bg-gradient-to-r from-green-400/10 to-emerald-400/10' 
              : saveStatus === 'saving'
              ? 'bg-gradient-to-r from-blue-400/10 to-cyan-400/10'
              : saveStatus === 'error'
              ? 'bg-gradient-to-r from-red-400/10 to-rose-400/10'
              : 'bg-gradient-to-r from-gray-400/10 to-slate-400/10'
          }`} />
        </div>

        {/* 图标容器 */}
        <div className="relative z-10">
          {getIcon()}
        </div>

        {/* 涟漪效果 */}
        {saveStatus === 'saved' && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-green-400/50"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
      </motion.button>
    </div>
  );
};

export default DraftSaveIndicator;