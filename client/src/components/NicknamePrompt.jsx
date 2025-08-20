// client/src/components/NicknamePrompt.jsx - 昵称设置引导组件

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { User, X, Sparkles } from 'lucide-react';
import WelcomeCelebration from './WelcomeCelebration';

const NicknamePrompt = ({ user, onUserUpdate, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // 检查是否应该显示提醒
  useEffect(() => {
    if (!user) return;

    // 检查条件：
    // 1. 用户没有设置昵称
    // 2. 用户偏好显示昵称提醒
    // 3. 组件还没有在本次会话中被交互过
    const shouldShow = 
      !user.nickname && 
      user.preferences?.showNicknamePrompt !== false && 
      !hasInteracted;

    if (shouldShow) {
      // 延迟1秒显示，让用户先适应页面
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, hasInteracted]);

  // 处理设置昵称
  const handleSetNickname = async () => {
    if (!nickname.trim()) {
      toast.error('请输入昵称');
      return;
    }

    if (nickname.trim().length > 20) {
      toast.error('昵称长度不能超过20个字符');
      return;
    }

    setLoading(true);

    try {
      const response = await api.patch('/user/nickname', {
        nickname: nickname.trim()
      });

      if (response.data.success) {
        const updatedUser = response.data.user;
        onUserUpdate(updatedUser);
        handleClose();
        
        // 显示庆祝效果
        setTimeout(() => {
          setShowCelebration(true);
        }, 500);
      }
    } catch (error) {
      console.error('设置昵称失败:', error);
      toast.error(error.response?.data?.message || '设置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理跳过设置
  const handleSkip = () => {
    setHasInteracted(true);
    handleClose();
  };

  // 处理不再提示
  const handleNeverShow = async () => {
    try {
      await api.patch('/user/disable-nickname-prompt');
      toast.success('已关闭昵称提醒');
      handleClose();
    } catch (error) {
      console.error('禁用提醒失败:', error);
      toast.error('操作失败，请重试');
    }
  };

  // 处理关闭
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSetNickname();
    } else if (e.key === 'Escape') {
      handleSkip();
    }
  };

  if (!isVisible) {
    return (
      <>
        {/* 庆祝效果 */}
        <WelcomeCelebration
          user={user}
          isVisible={showCelebration}
          onClose={() => setShowCelebration(false)}
        />
      </>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          onClick={handleSkip}
        />
        
        {/* 弹窗内容 */}
        <div className="min-h-screen px-4 text-center">
          <div className="inline-block w-full max-w-sm my-16 sm:my-20 overflow-hidden text-left align-middle transition-all transform">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* 头部装饰 */}
              <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-center relative">
                <button
                  onClick={handleSkip}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-xl font-bold text-white mb-2">
                  设置个性昵称
                </h2>
                <p className="text-white/90 text-sm">
                  让大家更容易记住你吧！
                </p>
              </div>

              {/* 内容区域 */}
              <div className="p-6 space-y-6">
                {/* 用户信息显示 */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role === 'teacher' ? '教师账户' : '学生账户'}
                    </p>
                  </div>
                </div>

                {/* 昵称输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    你的昵称
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入一个好听的昵称"
                    maxLength={20}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder-gray-400 dark:placeholder-gray-500 text-center text-lg font-medium"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    {nickname.length}/20 字符 • 可以随时在设置中更改
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="space-y-3">
                  <button
                    onClick={handleSetNickname}
                    disabled={!nickname.trim() || loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 
                             bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl 
                             hover:from-blue-600 hover:to-purple-700 
                             focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                             disabled:opacity-50 disabled:cursor-not-allowed 
                             transition-all duration-200 font-medium"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    {loading ? '设置中...' : '设置昵称'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSkip}
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                               hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 
                               rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      暂时跳过
                    </button>
                    <button
                      onClick={handleNeverShow}
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-sm text-gray-500 dark:text-gray-500 
                               hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                               rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      不再提示
                    </button>
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 庆祝效果 */}
        <WelcomeCelebration
          user={user}
          isVisible={showCelebration}
          onClose={() => setShowCelebration(false)}
        />
      </div>
    </AnimatePresence>
  );
};

export default NicknamePrompt;