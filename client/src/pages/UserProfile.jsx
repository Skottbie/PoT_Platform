// client/src/pages/UserProfile.jsx - 修复主题同步冲突的完整版本

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Settings, Save, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const UserProfile = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
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
          theme: userData.preferences?.theme || theme,
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
  }, [navigate, theme]);

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
  };

  // 重置表单
  const handleReset = () => {
    setFormData(originalData);
    // 重置主题到原始状态
    if (originalData.theme !== theme) {
      setTheme(originalData.theme);
    }
  };

  // 🔧 修复后的保存设置
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
      
      // 🔧 关键修复：不重新获取用户信息，避免触发主题重新同步
      // 直接更新本地状态
      const newData = {
        nickname: formData.nickname,
        theme: formData.theme,
        showNicknamePrompt: formData.showNicknamePrompt
      };
      
      // 更新用户状态（如果需要）
      if (user) {
        const updatedUser = {
          ...user,
          nickname: formData.nickname || null,
          preferences: {
            ...user.preferences,
            theme: formData.theme,
            showNicknamePrompt: formData.showNicknamePrompt
          }
        };
        setUser(updatedUser);
      }
      
      setOriginalData(newData);
      
      // 🔧 主题已经在 handleInputChange 中设置，无需重复设置
      console.log('Settings saved, theme already applied');
      
      toast.success('设置保存成功！');
      
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error(error.response?.data?.message || '保存失败，请重试');
      
      // 🔧 保存失败时，恢复原始状态
      setFormData(originalData);
      if (originalData.theme !== theme) {
        setTheme(originalData.theme);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 页面头部 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              个人设置
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              管理你的个人信息和偏好设置
            </p>
          </div>
        </motion.div>

        {/* 设置表单 */}
        <div className="space-y-6">
          {/* 个人信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="w-4 h-4" />
                个人信息
              </h3>
              
              {/* 邮箱显示 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邮箱地址
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                  {user?.email}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  邮箱地址不可修改
                </p>
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

          {/* 偏好设置 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
                  disabled={true}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
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
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.showNicknamePrompt}
                    onChange={(e) => handleInputChange('showNicknamePrompt', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                             focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      显示昵称设置提醒
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      新用户登录时提醒设置昵称
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* 操作按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3"
          >
            <button
              onClick={handleSave}
              disabled={!hasChanges() || saving}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
                         transition-all duration-200 ${
                hasChanges() && !saving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存设置'}
            </button>
            
            <button
              onClick={handleReset}
              disabled={!hasChanges() || saving}
              className={`px-6 py-3 rounded-lg font-medium border transition-all duration-200 ${
                hasChanges() && !saving
                  ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </motion.div>

          {/* 提示信息 */}
          {hasChanges() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
            >
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 你有未保存的更改，请点击"保存设置"来保存你的修改。
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;