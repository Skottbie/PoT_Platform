// client/src/utils/aigcDisplayUtils.js
// AIGC记录展示优化工具函数

/**
 * 检测AIGC记录中是否包含PoT模式
 * @param {Array} aigcContent - AIGC对话记录数组
 * @returns {boolean} 是否包含PoT模式的对话
 */
export const detectPoTMode = (aigcContent) => {
  if (!Array.isArray(aigcContent) || aigcContent.length === 0) {
    return false;
  }
  
  // 检查是否有任何消息标记为PoT模式
  return aigcContent.some(entry => 
    entry.potMode === true || 
    entry.model === 'pot-tutor' ||
    (entry.role === 'assistant' && entry.model && entry.model.includes('pot'))
  );
};

/**
 * 获取模型显示名称
 * @param {string} modelValue - 模型值
 * @param {boolean} isPotMode - 是否为PoT模式
 * @returns {string} 显示名称
 */
export const getModelDisplayName = (modelValue, isPotMode = false) => {
  if (isPotMode || modelValue === 'pot-tutor') {
    return 'PoT Tutor';
  }
  
  switch(modelValue) {
    case 'qwen-flash': return '通义千问-Flash';
    case 'qwen-plus': return '通义千问-Plus'; 
    case 'deepseek-r1-distill': return 'DeepSeek-R1';
    case 'ernie-speed': return 'ERNIE Speed';
    case 'openai': return 'ChatGPT';
    default: return modelValue || '未知模型';
  }
};

/**
 * 获取线性图标
 */
export const getLinearIcons = () => {
  return {
    // 对话气泡图标 (用于标题)
    conversation: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    
    // 用户轮廓图标
    user: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    
    // AI图标 (通用)
    ai: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  };
};

/**
 * 获取PoT模式气泡样式类名
 * @param {string} role - 角色 ('user' | 'assistant')
 * @param {boolean} isPoTMode - 是否为PoT模式
 * @returns {string} CSS类名
 */
export const getPoTBubbleStyles = (role, isPoTMode) => {
  if (!isPoTMode) {
    // 普通模式样式
    return role === 'user' 
      ? 'bg-blue-100 dark:bg-blue-900/40' 
      : 'bg-green-100 dark:bg-green-900/40';
  }
  
  // PoT模式使用统一配色系统
  return role === 'user'
    ? 'bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:bg-gradient-to-br dark:from-purple-900/40 dark:to-indigo-900/40 border border-amber-200/50 dark:border-purple-500/30'
    : 'bg-gradient-to-br from-amber-100/60 to-rose-50/60 dark:bg-gradient-to-br dark:from-purple-800/50 dark:to-indigo-800/50 border border-amber-300/40 dark:border-purple-400/40';
};