// client/src/components/UserProfileModal.jsx - 用户信息设置弹窗（集成主题系统）

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { X, User, Settings, Save, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext'; // 🆕 使用主题系统

const UserProfileModal = ({ isOpen, onClose, user, onUserUpdate }) => {
  const { theme, setTheme } = useTheme(); // 🆕 使用主题系统
  const [formData, setFormData] = useState({
    nickname: '',
    theme: 'auto',
    showNicknamePrompt: true
  });
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // 初始化表单数据
  useEffect(() => {
    if (user && isOpen) {
      const initialData = {
        nickname: user.nickname || '',
        theme: user.preferences?.theme || theme, // 🆕 使用当前主题作为默认值
        showNicknamePrompt: user.preferences?.showNicknamePrompt !== false
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [user, isOpen, theme]); // 🆕 添加 theme 依赖

  // 检查是否有变更
  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  // 处理输入变更
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 🆕 主题变更时立即应用
    if (field === 'theme') {
      setTheme(value);
    }
  };

  // 重置表单
  const handleReset = () => {
    setFormData(originalData);
  };

  // 保存设置
  const handleSave = async () => {
    if (!hasChanges()) {
      toast.success('没有需要保存的更改');
      return;
    }

    setLoading(true);
    
    try {
      // 并行更新昵称和偏好设置
      const promises = [];
      
      // 如果昵称有变更
      if (formData.nickname !== originalData.nickname) {
        promises.push(
          api.patch('/user/nickname', { 
            nickname: formData.nickname.trim() || null 
          })
        );
      }
      
      // 如果偏好设置有变更
      const preferencesChanged = 
        formData.theme !== originalData.theme ||
        formData.showNicknamePrompt !== originalData.showNicknamePrompt;
      
      if (preferencesChanged) {
        promises.push(
          api.put('/user/preferences', {
            theme: formData.theme,
            showNicknamePrompt: formData.showNicknamePrompt
          })
        );
      }
      
      // 等待所有请求完成
      const results = await Promise.all(promises);
      
      // 获取最新的用户信息
      const userResponse = await api.get('/user/profile');
      const updatedUser = userResponse.data;
      
      // 更新父组件的用户信息
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      
      // 更新本地状态
      const newData = {
        nickname: updatedUser.nickname || '',
        theme: updatedUser.preferences?.theme || 'auto',
        showNicknamePrompt: updatedUser.preferences?.showNicknamePrompt !== false
      };
      setFormData(newData);
      setOriginalData(newData);
      
      // 🆕 同步主题设置
      if (newData.theme !== theme) {
        setTheme(newData.theme);
      }
      
      toast.success('设置保存成功！');
      
      // 延迟关闭弹窗
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 关闭弹窗处理
  const handleClose = () => {
    if (hasChanges()) {
      if (window.confirm('你有未保存的更改，确定要关闭吗？')) {
        setFormData(originalData);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* 弹窗内容 */}
        <div className="min-h-screen px-4 text-center">
          <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      个人设置
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      管理你的个人信息和偏好
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    基本信息
                  </h3>
                  
                  {/* 邮箱显示 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      邮箱
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </div>
                  </div>
                  
                  {/* 昵称设置 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      昵称
                    </label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => handleInputChange('nickname', e.target.value)}
                      placeholder="设置一个个性昵称（可选）"
                      maxLength={20}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formData.nickname.length}/20 字符 • 留空则显示邮箱前缀
                    </p>
                  </div>
                </div>

                {/* 偏好设置 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    偏好设置
                  </h3>
                  
                  {/* 主题设置 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      界面主题
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="auto">🌓 跟随系统</option>
                      <option value="light">☀️ 浅色主题</option>
                      <option value="dark">🌙 深色主题</option>
                    </select>
                  </div>
                  
                  {/* 昵称提醒设置 */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showNicknamePrompt}
                        onChange={(e) => handleInputChange('showNicknamePrompt', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                                 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 
                                 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          显示昵称设置提醒
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          未设置昵称时提醒设置
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges() || loading}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 
                           hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 
                           rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                             hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 
                             rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges() || loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 
                             text-white rounded-lg hover:from-blue-600 hover:to-purple-700 
                             focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {loading ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default UserProfileModal;