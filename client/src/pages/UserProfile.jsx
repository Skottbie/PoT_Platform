// client/src/pages/UserProfile.jsx - 移动端用户设置页面（集成主题系统）

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Settings, Save, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext'; // 🆕 使用主题系统

const UserProfile = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme(); // 🆕 使用主题系统
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nickname: '',
    theme: 'auto',
    showNicknamePrompt: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/user/profile');
        const userData = res.data;
        setUser(userData);
        
        const initialData = {
          nickname: userData.nickname || '',
          theme: userData.preferences?.theme || theme, // 🆕 使用当前主题作为默认值
          showNicknamePrompt: userData.preferences?.showNicknamePrompt !== false
        };
        setFormData(initialData);
        setOriginalData(initialData);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        toast.error('获取用户信息失败');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, theme]); // 🆕 添加 theme 依赖

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

    setSaving(true);
    
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
      
      // 获取最新的用户信息
      const userResponse = await api.get('/user/profile');
      const updatedUser = userResponse.data;
      setUser(updatedUser);
      
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
      
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 返回处理
  const handleBack = () => {
    if (hasChanges()) {
      if (window.confirm('你有未保存的更改，确定要返回吗？')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              个人设置
            </h1>
          </div>
          
          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={!hasChanges() || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 
                     text-white rounded-lg hover:from-blue-600 hover:to-purple-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 页面内容 */}
      <div className="px-4 py-6 space-y-6">
        {/* 用户信息卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {user?.nickname || user?.email.split('@')[0]}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mt-1">
                {user?.role === 'teacher' ? '教师' : '学生'}
              </span>
            </div>
          </div>

          {/* 基本信息设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="w-4 h-4" />
              基本信息
            </h3>
            
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.nickname.length}/20 字符 • 留空则显示邮箱前缀
              </p>
            </div>
          </div>
        </motion.div>

        {/* 偏好设置卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
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
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.showNicknamePrompt}
                  onChange={(e) => handleInputChange('showNicknamePrompt', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded 
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
        </motion.div>

        {/* 重置按钮 */}
        {hasChanges() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                       hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 
                       rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重置更改
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;