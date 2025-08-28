// client/src/components/WelcomeOnboarding.jsx
// 🎯 兼容现有NicknamePrompt触发逻辑的欢迎引导组件

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { 
  User, 
  X, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Play,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import WelcomeCelebration from './WelcomeCelebration';
import { useSandbox } from '../contexts/SandboxContext';

const WelcomeOnboarding = ({ user, onUserUpdate, onClose }) => {
  const { toggleSandboxMode, markWelcomeSeen } = useSandbox();
  
  // 流程状态控制
  const [currentStep, setCurrentStep] = useState('nickname'); // 'nickname' | 'sandbox' | 'complete'
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // 昵称设置状态
  const [nickname, setNickname] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);
  
  // 沙盒选择状态
  const [sandboxChoice, setSandboxChoice] = useState(null); // 'demo' | 'direct'
  
  // 完成状态
  const [showCelebration, setShowCelebration] = useState(false);

  // 🎯 保持原有的触发逻辑（完全兼容NicknamePrompt）
  useEffect(() => {
    if (!user) return;

    // 检查条件（与原NicknamePrompt完全一致）：
    // 1. 用户没有设置昵称
    // 2. 用户偏好显示昵称提醒
    // 3. 组件还没有在本次会话中被交互过
    const shouldShow = 
      !user.nickname && 
      user.preferences?.showNicknamePrompt !== false && 
      !hasInteracted;

    if (shouldShow) {
      // 延迟1秒显示，让用户先适应页面（保持原逻辑）
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, hasInteracted]);

  // 键盘事件处理
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (currentStep === 'nickname') {
        handleSetNickname();
      }
    } else if (e.key === 'Escape') {
      handleSkip();
    }
  };

  // 处理设置昵称（保持原API调用）
  const handleSetNickname = async () => {
    if (!nickname.trim()) {
      toast.error('请输入昵称');
      return;
    }

    if (nickname.trim().length > 20) {
      toast.error('昵称长度不能超过20个字符');
      return;
    }

    setNicknameLoading(true);

    try {
      const response = await api.patch('/user/nickname', {
        nickname: nickname.trim()
      });

      if (response.data.success) {
        const updatedUser = response.data.user;
        onUserUpdate(updatedUser); // 调用Dashboard的用户更新函数
        
        // 进入下一步：沙盒模式选择
        setCurrentStep('sandbox');
      }
    } catch (error) {
      console.error('设置昵称失败:', error);
      toast.error(error.response?.data?.message || '设置失败，请重试');
    } finally {
      setNicknameLoading(false);
    }
  };

  // 处理跳过昵称设置，直接进入沙盒选择
  const handleSkipNickname = () => {
    setCurrentStep('sandbox');
  };

  // 处理沙盒模式选择
  const handleSandboxChoice = async (choice) => {
    setSandboxChoice(choice);
    
    try {
      // 标记已看过欢迎提示
      await markWelcomeSeen();
      
      if (choice === 'demo') {
        // 进入沙盒模式
        toggleSandboxMode(true);
        toast.success('🎭 欢迎进入沙盒模式！你可以自由体验平台功能');
      } else {
        // 进入正常模式
        toggleSandboxMode(false);
        toast.success('✨ 欢迎来到PoTAcademy！开始你的学习之旅');
      }
      
      // 显示完成状态
      setCurrentStep('complete');
      
      // 延迟关闭并显示庆祝效果
      setTimeout(() => {
        handleClose();
        setTimeout(() => {
          setShowCelebration(true);
        }, 300);
      }, 1500);
      
    } catch (error) {
      console.error('处理选择失败:', error);
      toast.error('操作失败，请重试');
    }
  };

  // 返回上一步
  const handleBack = () => {
    if (currentStep === 'sandbox') {
      setCurrentStep('nickname');
    }
  };

  // 处理跳过设置（保持原逻辑）
  const handleSkip = () => {
    setHasInteracted(true);
    handleClose();
  };

  // 处理不再提示（保持原API调用）
  const handleNeverShow = async () => {
    try {
      await api.patch('/user/disable-nickname-prompt');
      await markWelcomeSeen();
      toast.success('已关闭欢迎引导');
      handleClose();
    } catch (error) {
      console.error('禁用提醒失败:', error);
      toast.error('操作失败，请重试');
    }
  };

  // 处理关闭（保持原逻辑）
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setHasInteracted(true);
      if (onClose) onClose();
    }, 300);
  };

  // 如果不可见，只显示庆祝效果（兼容原逻辑）
  if (!isVisible) {
    return (
      <>
        {showCelebration && (
          <WelcomeCelebration
            user={user}
            isVisible={showCelebration}
            onClose={() => setShowCelebration(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={currentStep === 'complete' ? handleClose : handleSkip}
          />

          {/* 模态框容器 */}
          <div className="min-h-screen px-4 text-center">
            <div className="inline-block w-full max-w-sm my-16 sm:my-20 overflow-hidden text-left align-middle transition-all transform">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
              
                {/* Step 1: 昵称设置 */}
                {currentStep === 'nickname' && (
                  <>
                    {/* 头部 */}
                    <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-center relative">
                      <button
                        onClick={handleNeverShow}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                        title="不再显示"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                      
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      
                      <h2 className="text-xl font-bold text-white mb-2">
                        欢迎来到PoTAcademy
                      </h2>
                      <p className="text-white/90 text-sm">
                        先设置一个个性昵称吧！
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
                          disabled={!nickname.trim() || nicknameLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 
                                   bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl 
                                   hover:from-blue-600 hover:to-purple-700 
                                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                                   disabled:opacity-50 disabled:cursor-not-allowed 
                                   transition-all duration-200 font-medium"
                        >
                          {nicknameLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                          {nicknameLoading ? '设置中...' : '继续'}
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleSkipNickname}
                            disabled={nicknameLoading}
                            className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                                     hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 
                                     rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            跳过，使用邮箱前缀
                          </button>
                          <button
                            onClick={handleNeverShow}
                            disabled={nicknameLoading}
                            className="flex-1 px-4 py-2 text-sm text-gray-500 dark:text-gray-500 
                                     hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                                     rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            不再提示
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Step 2: 沙盒模式选择 */}
                {currentStep === 'sandbox' && (
                  <>
                    {/* 头部 */}
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 p-6 text-center relative">
                      <button
                        onClick={handleBack}
                        className="absolute top-4 left-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                        title="返回上一步"
                      >
                        <ArrowLeft className="w-5 h-5 text-white" />
                      </button>
                      
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      
                      <h2 className="text-xl font-bold text-white mb-2">
                        选择体验方式
                      </h2>
                      <p className="text-white/90 text-sm">
                        想先体验平台功能，还是直接开始使用？
                      </p>
                    </div>

                    {/* 选择区域 */}
                    <div className="p-6 space-y-4">
                      {/* 沙盒模式选项 */}
                      <motion.button
                        onClick={() => handleSandboxChoice('demo')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 border-2 border-blue-200 dark:border-blue-700 rounded-xl
                                 hover:border-blue-400 dark:hover:border-blue-500
                                 hover:bg-blue-50 dark:hover:bg-blue-900/20
                                 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              🎭 体验沙盒模式
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              通过预设的示例数据快速了解平台功能。包含示例班级、任务、学生作业等，让你在几分钟内掌握核心操作。
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                              <span>推荐新用户</span>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </motion.button>

                      {/* 直接使用选项 */}
                      <motion.button
                        onClick={() => handleSandboxChoice('direct')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl
                                 hover:border-gray-400 dark:hover:border-gray-500
                                 hover:bg-gray-50 dark:hover:bg-gray-700/20
                                 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              ✨ 直接开始使用
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              立即进入正常使用模式，从创建第一个班级或加入班级开始你的PoTAcademy之旅。
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <span>适合有经验的用户</span>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </motion.button>

                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                        你随时可以在设置中切换体验模式
                      </p>
                    </div>
                  </>
                )}
                
                {/* Step 3: 完成状态 */}
                {currentStep === 'complete' && (
                  <div className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.6 }}
                      className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      设置完成！
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {sandboxChoice === 'demo' 
                        ? '正在为你准备沙盒体验环境...' 
                        : '欢迎开始你的PoTAcademy之旅！'
                      }
                    </p>
                    
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }}
                      className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                )}
                
              </motion.div>
            </div>
          </div>
        </div>
      </AnimatePresence>
      
      {/* 庆祝效果 */}
      {showCelebration && (
        <WelcomeCelebration
          user={user}
          isVisible={showCelebration}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </>
  );
};

export default WelcomeOnboarding;