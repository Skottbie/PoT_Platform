// client/src/components/SandboxBanner.jsx
// 🎭 沙盒模式横幅提示

import { motion } from 'framer-motion';
import { Play, X, Settings, RotateCcw } from 'lucide-react';
import { useSandbox } from '../contexts/SandboxContext';

const SandboxBanner = () => {
  const { 
    isSandboxMode, 
    toggleSandboxMode, 
    clearSandboxChanges,
    sandboxChanges 
  } = useSandbox();

  if (!isSandboxMode) return null;

  const handleExitSandbox = () => {
    toggleSandboxMode(false);
  };

  const handleClearChanges = () => {
    clearSandboxChanges();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 
                 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 
                 border-l-4 border-amber-400 dark:border-amber-500 
                 px-4 py-3 mb-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Play className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-medium">🎭 沙盒模式已启用</span>
              <span className="hidden sm:inline"> - 当前使用示例数据体验平台功能</span>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              所有操作不会被保存，你可以安全地探索各种功能
              {sandboxChanges.size > 0 && (
                <span className="ml-2">
                  • 已记录 {sandboxChanges.size} 个操作
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 清空操作记录 */}
          {sandboxChanges.size > 0 && (
            <button
              onClick={handleClearChanges}
              className="p-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 
                       hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-md transition-colors"
              title="清空操作记录"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          {/* 退出沙盒模式 */}
          <button
            onClick={handleExitSandbox}
            className="p-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 
                     hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-md transition-colors"
            title="退出沙盒模式"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SandboxBanner;