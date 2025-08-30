// client/src/components/UserProfileModal.jsx - 添加登出功能的完整版本

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // 添加导航hook
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { X, User, Settings, Save, RotateCcw, LogOut } from 'lucide-react'; // 添加登出图标
import { useTheme } from '../contexts/ThemeContext';
import { useSandbox } from '../contexts/SandboxContext';

const UserProfileModal = ({ isOpen, onClose, user, onUserUpdate }) => {
  const { theme, setTheme } = useTheme();
  const { isSandboxMode, toggleSandboxMode } = useSandbox();

  const navigate = useNavigate(); // 添加导航功能
  const [formData, setFormData] = useState({
    nickname: '',
    theme: 'auto',
    showNicknamePrompt: true,
    sandboxMode: false
  });
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // 初始化表单数据
  useEffect(() => {
    if (user && isOpen) {
      const initialData = {
        nickname: user.nickname || '',
        theme: user.preferences?.theme || theme,
        showNicknamePrompt: user.preferences?.showNicknamePrompt !== false,
        sandboxMode: isSandboxMode
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [user, isOpen, theme, isSandboxMode]);

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
    
    // 主题变更时立即应用
    if (field === 'theme') {
      setTheme(value);
    }

      if (field === 'sandboxMode') {
      toggleSandboxMode(value);
    }
  };


  // 重置表单
  const handleReset = () => {
    setFormData(originalData);
    // 重置主题到原始状态
    if (originalData.theme !== theme) {
      setTheme(originalData.theme);
    }
  };

  // 登出功能
  const handleLogout = () => {
    // 清除本地存储的token
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
    // 关闭弹窗
    onClose();
    
    // 显示成功提示
    toast.success('已成功退出登录');
    
    // 导航到首页
    navigate('/login');
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
      await Promise.all(promises);
      
      // 关键修复：不重新获取用户信息，避免触发主题重新同步
      // 直接更新本地状态和父组件状态
      const newData = {
        nickname: formData.nickname,
        theme: formData.theme,
        showNicknamePrompt: formData.showNicknamePrompt
      };
      
      // 更新父组件的用户信息
      if (onUserUpdate && user) {
        const updatedUser = {
          ...user,
          nickname: formData.nickname || null,
          preferences: {
            ...user.preferences,
            theme: formData.theme,
            showNicknamePrompt: formData.showNicknamePrompt
          }
        };
        onUserUpdate(updatedUser);
      }
      
      setOriginalData(newData);
      
      // 主题已经在 handleInputChange 中设置，无需重复设置
      console.log('Settings saved, theme already applied');
      
      toast.success('设置保存成功！');
      
      // 延迟关闭弹窗
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error(error.response?.data?.message || '保存失败，请重试');
      
      // 保存失败时，恢复原始状态
      setFormData(originalData);
      if (originalData.theme !== theme) {
        setTheme(originalData.theme);
      }
    } finally {
      setLoading(false);
    }
  };

  // 关闭弹窗处理
  const handleClose = () => {
    if (hasChanges()) {
      if (window.confirm('你有未保存的更改，确定要关闭吗？')) {
        setFormData(originalData);
        // 恢复主题到原始状态
        if (originalData.theme !== theme) {
          setTheme(originalData.theme);
        }
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      个人设置
                    </h3>
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

              {/* 内容 */}
              <div className="p-6 space-y-6">
                {/* 个人信息 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    个人信息
                  </h4>
                  
                  {/* 邮箱显示 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      邮箱地址
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                   bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm">
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
                      placeholder="留空则显示邮箱前缀"
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
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    偏好设置
                  </h4>
                  
                  {/* 主题设置 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      界面主题
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="auto">🌓 跟随系统</option>
                      <option value="light">☀️ 浅色主题</option>
                      <option value="dark">🌙 深色主题</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      主题切换功能暂时关闭
                    </p>
                  </div>
                  
                  {/* 昵称提醒设置 */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showNicknamePrompt}
                        onChange={(e) => handleInputChange('showNicknamePrompt', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                                 focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          显示新手引导提醒
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          助您快速上手平台
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* 沙盒模式设置 - 仅教师端显示 */}
                  {user?.role === 'teacher' && (
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                        <input
                          type="checkbox"
                          checked={formData.sandboxMode}
                          onChange={(e) => handleInputChange('sandboxMode', e.target.checked)}
                          className="w-4 h-4 text-amber-600 bg-amber-100 border-amber-300 rounded 
                                  focus:ring-amber-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                            🎭 沙盒模式
                            {formData.sandboxMode && (
                              <span className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full">
                                已启用
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            使用示例数据体验平台功能，您无法在沙盒模式中提交任何更改。
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                
                </div>
              </div>

              {/* 底部操作区域 */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {/* 主要操作按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges() || loading}
                    className={`p-2 rounded-lg transition-colors ${
                      hasChanges() && !loading
                        ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    title="重置更改"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges() || loading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium
                               transition-all duration-200 ${
                      hasChanges() && !loading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {loading ? '保存中...' : '保存设置'}
                  </button>
                </div>

                {/* 登出按钮 - 独立区域 */}
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium
                             text-red-600 dark:text-red-400 
                             hover:bg-red-50 dark:hover:bg-red-900/20 
                             active:bg-red-100 dark:active:bg-red-900/30
                             transition-all duration-200
                             border border-transparent hover:border-red-200 dark:hover:border-red-700/50"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>

              {/* 变更提示 */}
              {hasChanges() && (
                <div className="mx-6 mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 你有未保存的更改
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default UserProfileModal;