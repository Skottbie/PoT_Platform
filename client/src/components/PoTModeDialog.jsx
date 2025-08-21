// client/src/components/PoTModeDialog.jsx - 修复版本
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from './EnhancedButton';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';

/**
 * PoT Mode 切换确认对话框
 * 修复：在全屏模式下对话框被覆盖的问题
 */
const PoTModeDialog = ({
  isOpen = false,
  action = 'enable', // 'enable' | 'disable'
  onConfirm,
  onCancel,
  isMobile = false
}) => {
  const haptic = useHapticFeedback();

  if (!isOpen) return null;

  const handleConfirm = () => {
    haptic.success();
    onConfirm?.();
  };

  const handleCancel = () => {
    haptic.light();
    onCancel?.();
  };

  const getDialogContent = () => {
    if (action === 'enable') {
      return {
        title: '切换到 PoT 模式',
        icon: '🧠',
        message: '⚠️ 切换到 PoT 模式将清空当前对话记录，是否继续？',
        description: 'PoT Tutor 将以全新的学习引导方式为您提供帮助',
        confirmText: '确认切换',
        confirmVariant: 'primary'
      };
    } else {
      return {
        title: '退出 PoT 模式',
        icon: '🔄',
        message: '⚠️ 退出 PoT 模式将清空当前对话记录，是否继续？',
        description: '您将返回到普通 AIGC 对话模式',
        confirmText: '确认退出',
        confirmVariant: 'warning'
      };
    }
  };

  const content = getDialogContent();

  return (
    <AnimatePresence>
      <motion.div
        // 🔧 关键修复：提升 z-index 到 z-[99999]，确保在全屏模式下也能正常显示
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* 背景遮罩 */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
        />

        {/* 对话框内容 */}
        <motion.div
          className={`
            relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
            border border-gray-200 dark:border-gray-700
            ${isMobile ? 'w-full max-w-sm mx-4' : 'w-full max-w-md mx-6'}
            overflow-hidden
          `}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.3 
          }}
        >
          {/* 头部图标区域 */}
          <div className={`
            text-center py-6 px-6
            bg-gradient-to-br ${action === 'enable' 
              ? 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20' 
              : 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50'
            }
          `}>
            <div className="text-4xl mb-3">
              {content.icon}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {content.title}
            </h2>
          </div>

          {/* 内容区域 */}
          <div className="p-6 pt-4">
            <div className="text-center mb-6">
              <p className="text-gray-700 dark:text-gray-300 text-base mb-2 leading-relaxed">
                {content.message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {content.description}
              </p>
            </div>

            {/* 按钮区域 */}
            <div className={`
              flex gap-3
              ${isMobile ? 'flex-col-reverse' : 'flex-row-reverse'}
            `}>
              <PrimaryButton
                onClick={handleConfirm}
                size={isMobile ? "lg" : "md"}
                fullWidth={isMobile}
                variant={content.confirmVariant}
                className="min-w-[100px]"
              >
                {content.confirmText}
              </PrimaryButton>

              <SecondaryButton
                onClick={handleCancel}
                size={isMobile ? "lg" : "md"}
                fullWidth={isMobile}
                className="min-w-[100px]"
              >
                取消
              </SecondaryButton>
            </div>
          </div>

          {/* 底部装饰线 */}
          <div className={`
            h-1 bg-gradient-to-r
            ${action === 'enable' 
              ? 'from-amber-400 via-orange-400 to-amber-400' 
              : 'from-gray-400 via-slate-400 to-gray-400'
            }
          `} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PoTModeDialog;