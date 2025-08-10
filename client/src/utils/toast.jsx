// client/src/utils/toast.js - 高级Toast配置
/*
import toast, { Toaster } from 'react-hot-toast';

// 🎨 自定义样式配置
const toastStyles = {
  success: {
    duration: 3000,
    style: {
      background: 'linear-gradient(135deg, #10B981, #059669)',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
      border: 'none',
      backdropFilter: 'blur(10px)',
    },
    icon: '✅',
  },
  error: {
    duration: 4000,
    style: {
      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
      border: 'none',
      backdropFilter: 'blur(10px)',
    },
    icon: '❌',
  },
  warning: {
    duration: 3500,
    style: {
      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
      border: 'none',
      backdropFilter: 'blur(10px)',
    },
    icon: '⚠️',
  },
  info: {
    duration: 3000,
    style: {
      background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
      border: 'none',
      backdropFilter: 'blur(10px)',
    },
    icon: 'ℹ️',
  },
  loading: {
    duration: Infinity,
    style: {
      background: 'linear-gradient(135deg, #6B7280, #4B5563)',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 10px 25px rgba(107, 114, 128, 0.3)',
      border: 'none',
      backdropFilter: 'blur(10px)',
    },
    icon: '⏳',
  }
};

// 🚀 高级通知函数
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...toastStyles.success,
      ...options,
    });
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      ...toastStyles.error,
      ...options,
    });
  },
  
  warning: (message, options = {}) => {
    return toast(message, {
      ...toastStyles.warning,
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    return toast(message, {
      ...toastStyles.info,
      ...options,
    });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...toastStyles.loading,
      ...options,
    });
  },

  // 🎯 进度通知
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, {
      loading: messages.loading || '处理中...',
      success: messages.success || '操作成功！',
      error: messages.error || '操作失败',
    }, {
      style: toastStyles.info.style,
      ...options,
    });
  },

  // 🔔 确认对话框替代alert
  confirm: (message, onConfirm, onCancel = () => {}) => {
    return toast((t) => (
      <div className="flex flex-col gap-3 min-w-0">
        <p className="text-gray-800 dark:text-gray-200 font-medium break-words">
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              onCancel();
            }}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
          >
            确认
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        background: 'white',
        color: 'black',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '400px',
        minWidth: '300px',
      },
    });
  },

  // 📋 自定义内容
  custom: (content, options = {}) => {
    return toast.custom(content, {
      duration: 3000,
      ...options,
    });
  },

  // 🗑️ 关闭所有通知
  dismissAll: () => {
    toast.dismiss();
  }
};

// 🎨 Toaster组件配置 - 在App.jsx中使用
export const ToasterConfig = () => (
  <Toaster
    position="top-center"
    reverseOrder={false}
    gutter={8}
    containerClassName=""
    containerStyle={{
      top: 20,
      left: 20,
      bottom: 20,
      right: 20,
    }}
    toastOptions={{
      // 全局默认样式
      className: '',
      duration: 3000,
      style: {
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '12px 16px',
        minWidth: '250px',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      },
      
      // 响应式设计
      success: {
        style: toastStyles.success.style,
        iconTheme: {
          primary: '#10B981',
          secondary: '#FFFFFF',
        },
      },
      error: {
        style: toastStyles.error.style,
        iconTheme: {
          primary: '#EF4444',
          secondary: '#FFFFFF',
        },
      },
      loading: {
        style: toastStyles.loading.style,
        iconTheme: {
          primary: '#6B7280',
          secondary: '#FFFFFF',
        },
      },
    }}
  />
);

// 🎯 使用示例和最佳实践
export const toastExamples = {
  // 基础用法
  basic: () => {
    showToast.success('操作成功！');
    showToast.error('操作失败，请重试');
    showToast.warning('请注意检查输入');
    showToast.info('这是一条提示信息');
  },

  // 加载状态
  loading: async () => {
    const loadingToast = showToast.loading('正在处理...');
    
    try {
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.dismiss(loadingToast);
      showToast.success('处理完成！');
    } catch (error) {
      toast.dismiss(loadingToast);
      showToast.error('处理失败');
    }
  },

  // Promise状态
  promise: () => {
    const asyncOperation = () => new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('成功') : reject('失败');
      }, 2000);
    });

    showToast.promise(asyncOperation(), {
      loading: '正在保存...',
      success: '保存成功！',
      error: '保存失败，请重试'
    });
  },

  // 确认对话框
  confirm: () => {
    showToast.confirm(
      '确定要删除这条记录吗？此操作不可恢复。',
      () => {
        showToast.success('删除成功！');
      },
      () => {
        showToast.info('已取消删除');
      }
    );
  },

  // 自定义样式
  custom: () => {
    showToast.success('自定义成功消息', {
      duration: 5000,
      style: {
        background: 'linear-gradient(45deg, #FF6B6B, #FF8E8E)',
        border: '2px solid #FF4757',
      }
    });
  }
};

export default showToast;
*/