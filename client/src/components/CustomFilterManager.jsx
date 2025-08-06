// src/components/CustomFilterManager.jsx
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import { getFilterDisplayText } from '../utils/filterUtils';

export default function CustomFilterManager({
  isOpen,
  onClose,
  customFilters = [],
  onApplyFilter,
  onEditFilter,
  onDeleteFilter,
  onDuplicateFilter,
  onRenameFilter,
  onExportFilters,
  onImportFilters,
  onResetToDefault,
  getFilterStats,
  searchCustomFilters
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: '确认',
    confirmVariant: 'danger'
  });
  const [renameDialog, setRenameDialog] = useState({
    isOpen: false,
    filterId: null,
    currentName: '',
    newName: ''
  });
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 搜索过滤
  const filteredCustomFilters = searchQuery.trim() 
    ? searchCustomFilters(searchQuery) 
    : customFilters;

  // 获取统计信息
  const stats = getFilterStats();

  // 获取筛选器颜色类
  const getColorClasses = (filter) => {
    const colorMap = {
      blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300',
      green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300',
      red: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300',
      orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300',
      purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300',
      pink: 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-300',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300',
      gray: 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
    };
    return colorMap[filter.color] || colorMap.blue;
  };

  // 显示确认对话框
  const showConfirm = (options) => {
    setConfirmDialog({
      isOpen: true,
      ...options
    });
  };

  // 处理删除
  const handleDelete = (filter) => {
    if (filter.isDefault) {
      showConfirm({
        title: '无法删除默认筛选器',
        message: '默认筛选器不能被删除，但您可以复制它们并创建自定义版本。',
        confirmText: '知道了',
        confirmVariant: 'primary',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    showConfirm({
      title: '确认删除筛选器',
      message: `确定要删除"${filter.name}"吗？此操作无法撤销。`,
      confirmText: '删除',
      confirmVariant: 'danger',
      onConfirm: () => {
        onDeleteFilter(filter.id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 处理重命名
  const handleRename = (filter) => {
    if (filter.isDefault) {
      showConfirm({
        title: '无法重命名默认筛选器',
        message: '默认筛选器不能被重命名，但您可以复制它们并创建自定义版本。',
        confirmText: '知道了',
        confirmVariant: 'primary',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setRenameDialog({
      isOpen: true,
      filterId: filter.id,
      currentName: filter.name,
      newName: filter.name
    });
  };

  // 执行重命名
  const executeRename = () => {
    if (renameDialog.newName.trim() && renameDialog.newName !== renameDialog.currentName) {
      onRenameFilter(renameDialog.filterId, renameDialog.newName);
    }
    setRenameDialog({ isOpen: false, filterId: null, currentName: '', newName: '' });
  };

  // 处理导出
  const handleExport = () => {
    try {
      onExportFilters();
    } catch (error) {
      showConfirm({
        title: '导出失败',
        message: '导出筛选器时发生错误，请重试。',
        confirmText: '知道了',
        confirmVariant: 'primary',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  // 处理导入
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const result = await onImportFilters(file);
      showConfirm({
        title: '导入完成',
        message: `成功导入 ${result.imported} 个筛选器${result.skipped > 0 ? `，跳过 ${result.skipped} 个重复项` : ''}。`,
        confirmText: '知道了',
        confirmVariant: 'primary',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
    } catch (error) {
      showConfirm({
        title: '导入失败',
        message: error.message || '导入筛选器时发生错误，请检查文件格式。',
        confirmText: '知道了',
        confirmVariant: 'primary',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setImportLoading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 处理重置
  const handleReset = () => {
    showConfirm({
      title: '确认重置筛选器',
      message: '这将删除所有自定义筛选器并恢复到默认设置。此操作无法撤销。',
      confirmText: '重置',
      confirmVariant: 'danger',
      onConfirm: () => {
        onResetToDefault();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🛠️</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  筛选器管理
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  管理您的自定义筛选器
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
            >
              <span className="text-gray-500 dark:text-gray-400">✕</span>
            </button>
          </div>

          {/* 统计信息 */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">总数量</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.custom}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">自定义</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.default}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">默认</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {stats.mostUsed?.usageCount || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">最高使用</div>
              </div>
            </div>
          </div>

          {/* 工具栏 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* 搜索框 */}
              <div className="relative flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索筛选器..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={importLoading}
                  disabled={importLoading}
                >
                  📥 导入
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  disabled={stats.custom === 0}
                >
                  📤 导出
                </Button>
                
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleReset}
                  disabled={stats.custom === 0}
                >
                  🔄 重置
                </Button>
              </div>
            </div>
          </div>

          {/* 筛选器列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredCustomFilters.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500 text-2xl">🔍</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {searchQuery ? `未找到包含"${searchQuery}"的筛选器` : '暂无自定义筛选器'}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    您可以在筛选面板中创建自定义筛选器
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCustomFilters.map((filter) => (
                  <motion.div
                    key={filter.id}
                    layout
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${getColorClasses(filter)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{filter.icon}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{filter.name}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {filter.isDefault && (
                              <span className="px-1.5 py-0.5 bg-white/50 dark:bg-gray-700/50 text-xs rounded-full">
                                默认
                              </span>
                            )}
                            {filter.usageCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-white/50 dark:bg-gray-700/50 text-xs rounded-full">
                                {filter.usageCount}次
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {filter.description && (
                          <p className="text-sm opacity-80 mb-2">{filter.description}</p>
                        )}
                        
                        <div className="space-y-1 mb-3">
                          {getFilterDisplayText(filter.filters).slice(0, 3).map((text, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs">
                              <div className="w-1 h-1 bg-current rounded-full opacity-60"></div>
                              <span className="truncate">{text}</span>
                            </div>
                          ))}
                          {getFilterDisplayText(filter.filters).length > 3 && (
                            <div className="text-xs opacity-60">
                              +{getFilterDisplayText(filter.filters).length - 3} 更多条件
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => onApplyFilter(filter.id)}
                            className="px-2 py-1 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-600/50 rounded text-xs font-medium transition-colors"
                          >
                            应用
                          </button>
                          
                          {!filter.isDefault && (
                            <button
                              onClick={() => onEditFilter(filter)}
                              className="px-2 py-1 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-600/50 rounded text-xs transition-colors"
                            >
                              编辑
                            </button>
                          )}
                          
                          <button
                            onClick={() => onDuplicateFilter(filter.id)}
                            className="px-2 py-1 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-600/50 rounded text-xs transition-colors"
                          >
                            复制
                          </button>
                          
                          <button
                            onClick={() => handleRename(filter)}
                            className="px-2 py-1 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-600/50 rounded text-xs transition-colors"
                          >
                            重命名
                          </button>
                          
                          <button
                            onClick={() => handleDelete(filter)}
                            className="px-2 py-1 bg-white/50 dark:bg-gray-700/50 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-xs transition-colors text-red-600 dark:text-red-400"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 底部 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredCustomFilters.length} / {customFilters.length} 个筛选器
                {searchQuery && ` • 搜索: "${searchQuery}"`}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.canCreateMore ? `还可创建 ${10 - stats.custom} 个` : '已达上限'}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                >
                  关闭
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
      />

      {/* 重命名对话框 */}
      <AnimatePresence>
        {renameDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={(e) => e.target === e.currentTarget && setRenameDialog(prev => ({ ...prev, isOpen: false }))}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                重命名筛选器
              </h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  新名称
                </label>
                <input
                  type="text"
                  value={renameDialog.newName}
                  onChange={(e) => setRenameDialog(prev => ({ ...prev, newName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入新的筛选器名称"
                  maxLength={20}
                  onKeyDown={(e) => e.key === 'Enter' && executeRename()}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {renameDialog.newName.length}/20 字符
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setRenameDialog(prev => ({ ...prev, isOpen: false }))}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={executeRename}
                  disabled={!renameDialog.newName.trim() || renameDialog.newName === renameDialog.currentName}
                >
                  确认
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}