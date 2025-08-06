// src/components/CustomFilterModal.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Select from './Select';
import { getFilterDisplayText } from '../utils/filterUtils';

// 图标选项
const iconOptions = [
  { value: '🔖', label: '书签', category: 'general' },
  { value: '⭐', label: '星星', category: 'general' },
  { value: '🎯', label: '目标', category: 'general' },
  { value: '🚀', label: '火箭', category: 'general' },
  { value: '⚡', label: '闪电', category: 'general' },
  { value: '🔥', label: '火焰', category: 'urgent' },
  { value: '🚨', label: '警报', category: 'urgent' },
  { value: '⏰', label: '时钟', category: 'time' },
  { value: '📅', label: '日历', category: 'time' },
  { value: '📝', label: '记事本', category: 'task' },
  { value: '📚', label: '书本', category: 'task' },
  { value: '🤖', label: '机器人', category: 'ai' },
  { value: '✅', label: '完成', category: 'status' },
  { value: '❌', label: '失败', category: 'status' },
  { value: '⚠️', label: '警告', category: 'status' }
];

// 颜色选项
const colorOptions = [
  { value: 'blue', label: '蓝色', color: 'bg-blue-500' },
  { value: 'green', label: '绿色', color: 'bg-green-500' },
  { value: 'red', label: '红色', color: 'bg-red-500' },
  { value: 'orange', label: '橙色', color: 'bg-orange-500' },
  { value: 'purple', label: '紫色', color: 'bg-purple-500' },
  { value: 'pink', label: '粉色', color: 'bg-pink-500' },
  { value: 'indigo', label: '靛蓝', color: 'bg-indigo-500' },
  { value: 'gray', label: '灰色', color: 'bg-gray-500' }
];

export default function CustomFilterModal({
  isOpen,
  onClose,
  onSave,
  currentFilters = {},
  editingFilter = null,
  userRole = 'student'
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🔖',
    color: 'blue',
    filters: {}
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 预览确认
  const [saving, setSaving] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (editingFilter) {
      setFormData({
        name: editingFilter.name,
        description: editingFilter.description || '',
        icon: editingFilter.icon || '🔖',
        color: editingFilter.color || 'blue',
        filters: editingFilter.filters || {}
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '🔖',
        color: 'blue',
        filters: { ...currentFilters }
      });
    }
    setStep(1);
    setErrors({});
  }, [isOpen, editingFilter, currentFilters]);

  // 表单验证
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入筛选器名称';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '名称至少需要2个字符';
    } else if (formData.name.trim().length > 20) {
      newErrors.name = '名称不能超过20个字符';
    }

    if (formData.description && formData.description.length > 100) {
      newErrors.description = '描述不能超过100个字符';
    }

    // 检查是否有有效的筛选条件
    const hasValidFilters = Object.entries(formData.filters).some(([key, value]) => {
      if (key === 'search') return value && value.trim();
      if (key.includes('Range')) return !!value;
      return value && value !== 'all' && value !== '';
    });

    if (!hasValidFilters) {
      newErrors.filters = '请设置至少一个筛选条件';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // 下一步
  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  // 保存筛选器
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim()
      });
      onClose();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setSaving(false);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  // 获取筛选器预览文本
  const getFilterPreview = () => {
    const texts = getFilterDisplayText(formData.filters);
    return texts.length > 0 ? texts : ['无筛选条件'];
  };

  // 图标分组
  const groupedIcons = iconOptions.reduce((groups, icon) => {
    const category = icon.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(icon);
    return groups;
  }, {});

  const categoryLabels = {
    general: '通用',
    urgent: '紧急',
    time: '时间',
    task: '任务',
    ai: 'AI',
    status: '状态'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  formData.color ? `bg-${formData.color}-100 dark:bg-${formData.color}-900/50` : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <span className="text-lg">{formData.icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {editingFilter ? '编辑自定义筛选器' : '创建自定义筛选器'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    步骤 {step} / 2
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                disabled={saving}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <span className="text-gray-500 dark:text-gray-400">✕</span>
              </button>
            </div>

            {/* 步骤指示器 */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">基本信息</span>
                </div>
                
                <div className={`flex-1 h-px ${step >= 2 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">预览确认</span>
                </div>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto">
              {step === 1 && (
                <div className="p-6 space-y-6">
                  {/* 名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      筛选器名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="如：紧急待办、已完成作业"
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      maxLength={20}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formData.name.length}/20 字符
                    </p>
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      描述（可选）
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="简单描述这个筛选器的用途"
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                        errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      rows={3}
                      maxLength={100}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formData.description.length}/100 字符
                    </p>
                  </div>

                  {/* 图标选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                      选择图标
                    </label>
                    <div className="space-y-4">
                      {Object.entries(groupedIcons).map(([category, icons]) => (
                        <div key={category}>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            {categoryLabels[category]}
                          </div>
                          <div className="grid grid-cols-8 gap-2">
                            {icons.map((icon) => (
                              <button
                                key={icon.value}
                                type="button"
                                onClick={() => handleInputChange('icon', icon.value)}
                                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all hover:scale-105 ${
                                  formData.icon === icon.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                                title={icon.label}
                              >
                                {icon.value}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 颜色选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                      主题颜色
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleInputChange('color', color.value)}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                            formData.color === color.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full ${color.color}`} />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{color.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 当前筛选条件预览 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                      筛选条件预览
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      {getFilterPreview().length > 0 ? (
                        <div className="space-y-2">
                          {getFilterPreview().map((text, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1 h-1 bg-blue-500 rounded-full" />
                              <span className="text-gray-700 dark:text-gray-200">{text}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-gray-400 dark:text-gray-500 mb-2">🔍</div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            请先设置筛选条件，然后创建自定义筛选器
                          </p>
                        </div>
                      )}
                    </div>
                    {errors.filters && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.filters}</p>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="p-6">
                  {/* 预览卡片 */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
                        预览您的自定义筛选器
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        确认信息无误后点击保存
                      </p>
                    </div>

                    {/* 筛选器卡片预览 */}
                    <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                      formData.color === 'blue' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' :
                      formData.color === 'green' ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700' :
                      formData.color === 'red' ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' :
                      formData.color === 'orange' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700' :
                      formData.color === 'purple' ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700' :
                      formData.color === 'pink' ? 'border-pink-300 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-700' :
                      formData.color === 'indigo' ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-700' :
                      'border-gray-300 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-700'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          formData.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50' :
                          formData.color === 'green' ? 'bg-green-100 dark:bg-green-900/50' :
                          formData.color === 'red' ? 'bg-red-100 dark:bg-red-900/50' :
                          formData.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/50' :
                          formData.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/50' :
                          formData.color === 'pink' ? 'bg-pink-100 dark:bg-pink-900/50' :
                          formData.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/50' :
                          'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <span className="text-lg">{formData.icon}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-800 dark:text-gray-100 truncate">
                              {formData.name || '未命名筛选器'}
                            </h3>
                            <span className="px-2 py-0.5 bg-white/50 dark:bg-gray-700/50 text-xs rounded-full text-gray-600 dark:text-gray-400">
                              自定义
                            </span>
                          </div>
                          
                          {formData.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {formData.description}
                            </p>
                          )}
                          
                          <div className="space-y-1">
                            {getFilterPreview().map((text, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${
                                  formData.color === 'blue' ? 'bg-blue-500' :
                                  formData.color === 'green' ? 'bg-green-500' :
                                  formData.color === 'red' ? 'bg-red-500' :
                                  formData.color === 'orange' ? 'bg-orange-500' :
                                  formData.color === 'purple' ? 'bg-purple-500' :
                                  formData.color === 'pink' ? 'bg-pink-500' :
                                  formData.color === 'indigo' ? 'bg-indigo-500' :
                                  'bg-gray-500'
                                }`} />
                                <span className="text-xs text-gray-600 dark:text-gray-400">{text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 保存提示 */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">i</span>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                            保存后您可以：
                          </div>
                          <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• 在快速筛选器中一键应用</li>
                            <li>• 在筛选器管理中编辑或删除</li>
                            <li>• 导出分享给其他用户</li>
                            <li>• 查看使用统计和历史</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {step === 1 ? '填写基本信息' : '确认并保存'}
                </div>
                
                <div className="flex items-center gap-3">
                  {step === 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(1)}
                      disabled={saving}
                    >
                      上一步
                    </Button>
                  )}
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClose}
                    disabled={saving}
                  >
                    取消
                  </Button>
                  
                  {step === 1 ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleNext}
                    >
                      下一步
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      loading={saving}
                    >
                      {editingFilter ? '更新筛选器' : '保存筛选器'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}