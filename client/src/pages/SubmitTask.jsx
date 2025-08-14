//src/pages/SubmitTask.jsx
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { motion, AnimatePresence } from 'framer-motion';
import { FormCard, NotificationCard } from '../components/EnhancedMobileCard';
import { PrimaryButton, SecondaryButton, WarningButton, IconButton } from '../components/EnhancedButton';
import LazyImageGrid from '../components/LazyImageGrid';
import { useDeviceDetection, useVirtualKeyboard, useHapticFeedback } from '../hooks/useDeviceDetetion';
import remarkGfm from 'remark-gfm';
import FontSizeSelector from '../components/FontSizeSelector';
import { useFontSize } from '../utils/fontSizeUtils';
import { FontSizeManager} from '../utils/fontSizeUtils';
import '../styles/aigcFontSize.css';
import { useDraftSave } from '../hooks/useDraftSave';
import DraftRestoreDialog from '../components/DraftRestoreDialog';
import DraftSaveIndicator from '../components/DraftSaveIndicator';
import BeforeUnloadDialog from '../components/BeforeUnloadDialog';


SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);

const SubmitTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  // 🎯 设备检测和触觉反馈
  const deviceInfo = useDeviceDetection();
  const keyboardState = useVirtualKeyboard();
  const haptic = useHapticFeedback();

  const MODEL_OPTIONS = [
  { value: 'openai', label: 'ChatGPT(维护中)' },
  { value: 'qwen', label: '通义千问' },
  // 未来可以在这里添加更多模型
  ];


  // 基础状态
  const [task, setTask] = useState(null);
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [imagePreviewIds, setImagePreviewIds] = useState([]);
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [model, setModel] = useState('qwen');
  
  const [aigcLog, setAigcLog] = useState([]);
  const [input, setInput] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shouldUploadAIGC, setShouldUploadAIGC] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { currentSize, currentConfig } = useFontSize();
  const [fontSizeKey, setFontSizeKey] = useState(currentSize);
  const [showFontSelector, setShowFontSelector] = useState(false);

  // 🎯 草稿保存相关
  const {
    saveStatus,
    hasDraft,
    showRestoreDialog,
    draftData,
    debouncedSave,
    manualSave,
    restoreDraft,
    ignoreDraft,
    deleteDraft,
    checkBeforeLeave
  } = useDraftSave(taskId);

  // 离开页面前的提醒状态
  const [showBeforeUnloadDialog, setShowBeforeUnloadDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);


  const handleFontSizeClick = useCallback(() => {
    //console.log('字号按钮被点击了');
    haptic.light();
    setShowFontSelector(true);
  }, [haptic]);

  const handleCloseFontSelector = useCallback(() => {
    setShowFontSelector(false);
    // 🔧 关键修复：同步最新的字号状态
    const latestSize = FontSizeManager.getCurrentSize();
    setFontSizeKey(latestSize);
  }, []);

  const getCurrentModelLabel = useCallback((modelValue) => {
    const selectedModel = MODEL_OPTIONS.find(option => option.value === modelValue);
    return selectedModel ? selectedModel.label : modelValue;
  }, []);

  const updateSelectWidth = useCallback((selectElement) => {
    if (!selectElement || !isMobile || !isFullscreen) return;
    
    const measurer = document.createElement('span');
    const selectStyles = window.getComputedStyle(selectElement);
    
    measurer.style.cssText = `
      visibility: hidden;
      position: absolute;
      top: -9999px;
      left: -9999px;
      white-space: nowrap;
      font-size: ${selectStyles.fontSize};
      font-weight: ${selectStyles.fontWeight};
      font-family: ${selectStyles.fontFamily};
      padding-left: ${selectStyles.paddingLeft};
      letter-spacing: ${selectStyles.letterSpacing};
    `;
    
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const selectedText = selectedOption ? selectedOption.textContent.trim() : '';
    
    if (!selectedText) return;
    
    measurer.textContent = selectedText;
    document.body.appendChild(measurer);
    
    try {
      const textWidth = measurer.offsetWidth;
      const arrowAndPadding = 32;
      const minSelectWidth = 80;
      const finalWidth = Math.max(textWidth + arrowAndPadding, minSelectWidth);
      
      selectElement.style.width = `${finalWidth}px`;
      selectElement.style.minWidth = `${finalWidth}px`;
    } finally {
      document.body.removeChild(measurer);
    }
  }, [isMobile, isFullscreen]);

  // 引用
  const chatBoxRef = useRef(null);
  const textareaRef = useRef(null);
  const selectRef = useRef(null);

  const getMarkdownComponents = (isUserMessage) => {
    // 复制到剪贴板的工具函数
    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        // 可以添加 toast 提示
        return true;
      } catch (err) {
        // 降级处理
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    };




    return {
      // 🎯 代码块处理 - 增加复制功能
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeContent = String(children).replace(/\n$/, '');

        if (!inline) {
          return (
            <div className="overflow-x-auto my-3 group relative">
              {/* 复制按钮 */}
              <button
                onClick={() => copyToClipboard(codeContent)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10"
                title="复制代码"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                复制
              </button>

              <SyntaxHighlighter
                style={github}
                language={match ? match[1] : 'text'}
                PreTag="div"
                className="rounded-lg text-sm"
                customStyle={{
                  margin: 0,
                  padding: '12px',
                  paddingTop: '40px', // 为复制按钮留出空间
                  borderRadius: '8px',
                  fontSize: 'var(--aigc-code-font-size)',
                  lineHeight: '1.4',
                  overflowX: 'auto',
                  backgroundColor: isUserMessage ? 'rgba(59, 130, 246, 0.1)' : '#f6f8fa',
                }}
                {...props}
              >
                {codeContent}
              </SyntaxHighlighter>
            </div>
          );
        }

        return (
          <code 
            className={`px-1.5 py-0.5 rounded text-xs font-mono ${
              isUserMessage 
                ? 'bg-blue-400/30 text-white' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
            }`}
            style={{ fontSize: 'var(--aigc-code-font-size)' }}
          >
            {children}
          </code>
        );
      },

      // 🎯 表格处理 - 移动端优化
      table({ children }) {
        return (
          <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              {children}
            </table>
          </div>
        );
      },

      thead({ children }) {
        return (
          <thead className={`${
            isUserMessage 
              ? 'bg-blue-500/20' 
              : 'bg-gray-50 dark:bg-gray-800'
          }`}>
            {children}
          </thead>
        );
      },

      tbody({ children }) {
        return (
          <tbody className={`${
            isUserMessage 
              ? 'bg-blue-500/5' 
              : 'bg-white dark:bg-gray-900'
          } divide-y divide-gray-200 dark:divide-gray-700`}>
            {children}
          </tbody>
        );
      },

      tr({ children }) {
        return (
          <tr className={`${
            isUserMessage 
              ? 'hover:bg-blue-500/10' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}>
            {children}
          </tr>
        );
      },

      th({ children }) {
        return (
          <th 
            className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${
              isUserMessage 
                ? 'text-white/90' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
            style={{ fontSize: 'var(--aigc-font-size-sm)' }}
          >
            {children}
          </th>
        );
      },

      td({ children }) {
        return (
          <td className={`px-3 py-2 text-sm ${
            isUserMessage 
              ? 'text-white/90' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {children}
          </td>
        );
      },

      // 🎯 列表处理 - 增加任务列表支持
      ul({ children }) {
        return (
          <ul className="list-disc list-inside my-2 space-y-1 pl-4">
            {children}
          </ul>
        );
      },

      ol({ children }) {
        return (
          <ol className="list-decimal list-inside my-2 space-y-1 pl-4">
            {children}
          </ol>
        );
      },

      li({ children, className }) {
        // 检查是否是任务列表项
        const isTaskList = className?.includes('task-list-item');
        
        if (isTaskList) {
          return (
            <li className="leading-relaxed list-none flex items-start gap-2 my-1">
              {children}
            </li>
          );
        }

        return (
          <li className="leading-relaxed">
            {children}
          </li>
        );
      },

      // 🎯 任务列表复选框处理
      input({ type, checked, disabled }) {
        if (type === 'checkbox') {
          return (
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5 pointer-events-none"
              readOnly
            />
          );
        }
        return <input type={type} checked={checked} disabled={disabled} />;
      },

      // 🎯 标题处理 - 保持现有的h1-h3
      h1({ children }) {
        return (
          <h1 className={`font-bold mt-4 mb-2 ${
            isUserMessage 
              ? 'text-white' 
              : 'text-gray-900 dark:text-gray-100'
          }`}
          style={{ fontSize: 'calc(var(--aigc-font-size-base) * 1.5)' }}
          >
            {children}
          </h1>
        );
      },

      h2({ children }) {
        return (
          <h2 className={`font-bold mt-3 mb-2 ${
            isUserMessage 
              ? 'text-white' 
              : 'text-gray-900 dark:text-gray-100'
          }`}
          style={{ fontSize: 'calc(var(--aigc-font-size-base) * 1.3)' }}
          >
            {children}
          </h2>
        );
      },

      h3({ children }) {
        return (
          <h3 className={`font-bold mt-3 mb-1 ${
            isUserMessage 
              ? 'text-white' 
              : 'text-gray-900 dark:text-gray-100'
          }`}
          style={{ fontSize: 'calc(var(--aigc-font-size-base) * 1.15)' }}
          >
            {children}
          </h3>
        );
      },

      // 🎯 段落处理
      p({ children }) {
        return (
          <p className="my-2 leading-relaxed">
            {children}
          </p>
        );
      },

      // 🎯 引用块处理 - 增强样式
      blockquote({ children }) {
        return (
          <blockquote className={`border-l-4 pl-4 py-2 my-3 rounded-r-lg relative ${
            isUserMessage 
              ? 'border-white/30 bg-white/10' 
              : 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
          }`}>
            {/* 引用图标 */}
            <div className={`absolute -left-2 -top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isUserMessage 
                ? 'bg-white/20 text-white/70' 
                : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
            }`}>
              "
            </div>
            <div className={`${
              isUserMessage 
                ? 'text-white/90' 
                : 'text-blue-800 dark:text-blue-200'
            }`}>
              {children}
            </div>
          </blockquote>
        );
      },

      // 🎯 链接处理 - 安全性增强
      a({ href, children }) {
        return (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`hover:underline font-medium transition-colors duration-200 ${
              isUserMessage 
                ? 'text-white/90 hover:text-white' 
                : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
            }`}
          >
            {children}
            {/* 外链图标 */}
            <svg className="inline w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        );
      },

      // 🎯 强调和加粗
      strong({ children }) {
        return (
          <strong className={`font-semibold ${
            isUserMessage 
              ? 'text-white' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {children}
          </strong>
        );
      },

      em({ children }) {
        return (
          <em className={`italic ${
            isUserMessage 
              ? 'text-white/90' 
              : 'text-gray-800 dark:text-gray-200'
          }`}>
            {children}
          </em>
        );
      },

      // 🎯 删除线支持
      del({ children }) {
        return (
          <del className={`line-through opacity-75 ${
            isUserMessage 
              ? 'text-white/70' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {children}
          </del>
        );
      },

      // 🎯 水平分割线
      hr() {
        return (
          <hr className={`my-4 border-t-2 ${
            isUserMessage 
              ? 'border-white/30' 
              : 'border-gray-300 dark:border-gray-600'
          }`} />
        );
      },

      // 🎯 图片处理 - 响应式优化
      img({ src, alt }) {
        return (
          <img 
            src={src} 
            alt={alt} 
            className="max-w-full h-auto rounded-lg my-2 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200"
            loading="lazy"
            style={{ maxHeight: '400px', objectFit: 'contain' }}
          />
        );
      },
    };
  };

  useEffect(() => {
    if (selectRef.current && isMobile && isFullscreen) {
      const selectElement = selectRef.current;
      
      updateSelectWidth(selectElement);
      
      let resizeObserver;
      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          updateSelectWidth(selectElement);
        });
        resizeObserver.observe(selectElement);
      }
      
      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  }, [isFullscreen, isMobile, updateSelectWidth]);

  useEffect(() => {
    if (selectRef.current && isMobile && isFullscreen) {
      requestAnimationFrame(() => {
        updateSelectWidth(selectRef.current);
      });
    }
  }, [model, updateSelectWidth, isMobile, isFullscreen]);


  useEffect(() => {
    const handleFontSizeChange = () => {
      const latestSize = FontSizeManager.getCurrentSize();
      setFontSizeKey(latestSize);
    };

    // 监听字号变化（如果有全局事件的话）
    window.addEventListener('fontSizeChanged', handleFontSizeChange);
    
    return () => {
      window.removeEventListener('fontSizeChanged', handleFontSizeChange);
    };
  }, []);

  // 🎯 反馈组件隐藏控制
  useEffect(() => {
    localStorage.setItem('hideFeedback', isFullscreen ? '1' : '0');
    const event = new Event('toggleFeedback');
    window.dispatchEvent(event);
  }, [isFullscreen]);

  // 🎯 全屏模式body样式控制 - 修复iPad和电脑端问题
  useEffect(() => {
    if (isFullscreen) {
      // 保存原始样式
      const originalStyles = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        height: document.body.style.height
      };

      // 设置全屏样式
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      return () => {
        // 恢复原始样式
        Object.keys(originalStyles).forEach(key => {
          document.body.style[key] = originalStyles[key];
        });
      };
    }
  }, [isFullscreen]);

  // 🚀 并发获取任务信息和提交状态
  const fetchTaskData = useCallback(async () => {
    try {
      setInitialLoading(true);
  
      const promises = [
        api.get(`/task/${taskId}`),
        api.get(`/submission/check/${taskId}`)
      ];

      const [taskRes, submissionRes] = await Promise.allSettled(promises);

      if (taskRes.status === 'fulfilled') {
        setTask(taskRes.value.data);
      } else {
        navigate('/student');
        return;
      }

      if (submissionRes.status === 'fulfilled') {
        setAlreadySubmitted(submissionRes.value.data.submitted);
      }

    } catch (err) {
      console.error('获取任务数据失败:', err);
      navigate('/student');
    } finally {
      setInitialLoading(false);
    }
  }, [taskId, navigate]);

  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [aigcLog, loading]);

  // 🎯 优化任务状态检查
  const taskStatus = useMemo(() => {
    if (!task) return null;
  
    const now = new Date();
    const deadline = new Date(task.deadline);
  
    if (now > deadline) {
      if (task.allowLateSubmission) {
        const lateMinutes = Math.floor((now - deadline) / (1000 * 60));
        const lateHours = Math.floor(lateMinutes / 60);
        const lateDays = Math.floor(lateHours / 24);
  
        let lateText = '';
        if (lateDays > 0) {
          lateText = `已逾期 ${lateDays} 天`;
        } else if (lateHours > 0) {
          lateText = `已逾期 ${lateHours} 小时`;
        } else {
          lateText = `已逾期 ${lateMinutes} 分钟`;
        }
  
        return {
          isLate: true,
          canSubmit: true,
          message: lateText,
          lateMinutes
        };
      } else {
        return {
          isLate: true,
          canSubmit: false,
          message: '任务已截止，不允许提交',
          lateMinutes: 0
        };
      }
    }
  
    return {
      isLate: false,
      canSubmit: true,
      message: '任务进行中',
      lateMinutes: 0
    };
  }, [task]);

  // 格式化截止时间
  const formatDeadline = useMemo(() => {
    if (!task) return '';
    const date = new Date(task.deadline);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [task]);

  // 🚀 优化 AIGC 提交
  const handleAIGCSubmit = useCallback(async () => {
    if (!input.trim()) return;

    haptic.light();

    const userMessage = { role: 'user', content: input, model: model };
    setAigcLog((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/aigc/chat', {
        messages: [...aigcLog, userMessage],
        model,
      });

      const aiMessage = { 
        role: 'assistant', 
        content: res.data.reply, 
        model: model 
      };
      setAigcLog((prev) => [...prev, aiMessage]);
      haptic.success();
    } catch (err) {
      console.error('AIGC请求失败:', err);
      const errorMessage = { 
        role: 'assistant', 
        content: '❌ AI 回复失败，请稍后重试',
        model: model 
      };
      setAigcLog((prev) => [...prev, errorMessage]);
      haptic.error();
    } finally {
      setLoading(false);
    }
  }, [input, aigcLog, model, haptic]);

  // 🎯 优化图片处理
  const handleImageChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    setImages(selectedFiles);
  
    const previewIds = selectedFiles.map((file, index) => `preview_${Date.now()}_${index}`);
    setImagePreviewIds(previewIds);
    
    if (selectedFiles.length > 0) {
      haptic.light();
    }
  }, [haptic]);

  // 🚀 优化图片预览渲染
  const renderImagePreview = useMemo(() => {
    if (!images || images.length === 0) return null;
  
    return (
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <span>📷</span>
          即将上传的图片预览 ({images.length} 张)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((file, index) => (
            <motion.div 
              key={index} 
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`预览 ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm group-hover:shadow-md transition-all duration-200"
              />
              <button
                type="button"
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm hover:shadow-md active:scale-90 transition-all duration-200"
                onClick={() => {
                  haptic.light();
                  const newImages = images.filter((_, i) => i !== index);
                  setImages(newImages);
                  const newPreviewIds = imagePreviewIds.filter((_, i) => i !== index);
                  setImagePreviewIds(newPreviewIds);
                }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }, [images, imagePreviewIds, haptic]);

  // 改进的自动调整输入框高度函数
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    
    const minHeight = 44;
    const maxHeight = isFullscreen ? 120 : 88;
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [isFullscreen]);


    // 12. 工具函数
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // 3. 自动保存逻辑 - 监听表单数据变化
  useEffect(() => {
    // 只有在有实际内容时才触发自动保存
    const hasContent = !!(
      content?.trim() ||
      images?.length > 0 ||
      file ||
      aigcLog?.length > 0
    );

    if (hasContent && task) {
      const currentData = {
        content,
        images,
        file,
        fileInfo: file ? {
          hasFile: true,
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileType: file.type
        } : { hasFile: false },
        aigcLog,
        model,
        shouldUploadAIGC
      };

      debouncedSave(currentData);
    }
  }, [content, images, file, aigcLog, model, shouldUploadAIGC, debouncedSave, task]);

  // 4. 恢复草稿的处理函数
  const handleRestoreDraft = useCallback(() => {
    if (!draftData) return;

    const restored = restoreDraft();
    if (restored) {
      // 恢复文本内容
      if (restored.content) {
        setContent(restored.content);
      }

      // 恢复图片
      if (restored.images && restored.images.length > 0) {
        const restoredImages = restored.images.map(img => {
          if (img.file instanceof File) {
            return img.file;
          }
          // 如果不是File对象，尝试重建
          return new File([new Blob()], img.name || 'restored_image', {
            type: img.type || 'image/jpeg',
            lastModified: img.lastModified || Date.now()
          });
        });
        setImages(restoredImages);
        
        // 重建预览URL
        const previewIds = restoredImages.map((_, index) => `restored_${index}`);
        setImagePreviewIds(previewIds);
      }

      // 恢复AIGC相关
      if (restored.aigcLog) {
        setAigcLog(restored.aigcLog);
      }
      if (restored.model) {
        setModel(restored.model);
      }
      if (typeof restored.shouldUploadAIGC === 'boolean') {
        setShouldUploadAIGC(restored.shouldUploadAIGC);
      }

      // 如果有文件信息，显示提示
      if (restored.fileInfo?.hasFile) {
        setMessage(`📋 草稿已恢复！请重新上传文件：${restored.fileInfo.fileName}`);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('📋 草稿已恢复！');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  }, [draftData, restoreDraft]);

  // 5. 手动保存处理函数
  const handleManualSave = useCallback(() => {
    const currentData = {
      content,
      images,
      file,
      fileInfo: file ? {
        hasFile: true,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type
      } : { hasFile: false },
      aigcLog,
      model,
      shouldUploadAIGC
    };

    manualSave(currentData);
  }, [content, images, file, aigcLog, model, shouldUploadAIGC, manualSave]);

  // 6. 页面离开前的检查
  const handleBeforeUnload = useCallback((e) => {
    const currentData = {
      content,
      images,
      file,
      aigcLog,
      model,
      shouldUploadAIGC
    };

    if (checkBeforeLeave(currentData)) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  }, [content, images, file, aigcLog, model, shouldUploadAIGC, checkBeforeLeave]);

  // 7. 拦截导航
  const handleNavigation = useCallback((targetPath) => {
    const currentData = {
      content,
      images,
      file,
      aigcLog,
      model,
      shouldUploadAIGC
    };

    if (checkBeforeLeave(currentData)) {
      setPendingNavigation(targetPath);
      setShowBeforeUnloadDialog(true);
      return false;
    }
    return true;
  }, [content, images, file, aigcLog, model, shouldUploadAIGC, checkBeforeLeave]);

  // 8. 离开页面对话框的处理函数
  const handleSaveAndLeave = useCallback(async () => {
    const currentData = {
      content,
      images,
      file,
      fileInfo: file ? {
        hasFile: true,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type
      } : { hasFile: false },
      aigcLog,
      model,
      shouldUploadAIGC
    };

    await manualSave(currentData);
    setShowBeforeUnloadDialog(false);
    
    if (pendingNavigation) {
      if (pendingNavigation === 'back') {
        navigate(-1);
      } else {
        navigate(pendingNavigation);
      }
    }
  }, [content, images, file, aigcLog, model, shouldUploadAIGC, manualSave, pendingNavigation, navigate]);

  const handleLeaveWithoutSave = useCallback(() => {
    setShowBeforeUnloadDialog(false);
    
    if (pendingNavigation) {
      if (pendingNavigation === 'back') {
        navigate(-1);
      } else {
        navigate(pendingNavigation);
      }
    }
  }, [pendingNavigation, navigate]);

  const handleCancelLeave = useCallback(() => {
    setShowBeforeUnloadDialog(false);
    setPendingNavigation(null);
  }, []);



  // 10. 注册beforeunload事件
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleBeforeUnload]);

  // 11. 修改返回按钮的点击处理
  const handleBackClick = useCallback((e) => {
    e.preventDefault();
    if (!handleNavigation('back')) {
      return;
    }
    navigate(-1);
  }, [handleNavigation, navigate]);




  // 🚀 优化提交处理
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setMessage('');

    if (!taskStatus?.canSubmit) {
      haptic.error();
      return setMessage(`❌ ${taskStatus.message}`);
    }

    // 表单验证
    if (task.needsFile && !file) {
      haptic.error();
      return setMessage('❌ 本任务要求上传作业文件。');
    }
    if (task.requireAIGCLog && (!aigcLog || aigcLog.length === 0)) {
      haptic.error();
      return setMessage('❌ 本任务要求上传 AIGC 原始记录，请先进行 AIGC 对话。');
    }
    if (!task.needsFile && (!images || images.length === 0) && !content.trim()) {
      haptic.error();
      return setMessage('❌ 请提交作业内容（文件、图片或文本）。');
    }

    haptic.medium();

    if (taskStatus?.isLate) {
      setMessage('⚠️ 正在提交逾期作业...');
    } else {
      setMessage('📤 正在提交作业...');
    }

    try {
      const formData = new FormData();
  
      if (content.trim()) {
        formData.append('content', content);
      }
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append('images', image);
        });
      }
      if (file) {
        formData.append('file', file);
      }

      if (task.requireAIGCLog && aigcLog.length > 0) {
        const logBlob = new Blob([JSON.stringify(aigcLog)], {
          type: 'application/json',
        });
        formData.append('aigcLog', logBlob, 'aigcLog.json');
      } else if (shouldUploadAIGC && aigcLog.length > 0) {
        const logBlob = new Blob([JSON.stringify(aigcLog)], {
          type: 'application/json',
        });
        formData.append('aigcLog', logBlob, 'aigcLog.json');
      }

      if (taskStatus?.isLate) {
        formData.append('isLateSubmission', 'true');
        formData.append('lateMinutes', taskStatus.lateMinutes.toString());
      }

      await api.post(`/submission/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      haptic.success();

      if (taskStatus?.isLate) {
        setMessage('⚠️ 逾期提交成功！该作业将被标注为逾期提交。');
      } else {
        setMessage('✅ 提交成功！');
      }
  
      // 清理表单
      setFile(null);
      setImages([]);
      setImagePreviewIds([]);
      setContent('');
      setAigcLog([]);

      setTimeout(() => {
        api.get('/task/all?category=active').catch(() => {});
        navigate('/student');
      }, 2000);

    } catch (err) {
      console.error('提交失败:', err);
      haptic.error();
      setMessage(`❌ 提交失败：${err.response?.data?.message || err.message}`);
    }
  }, [taskStatus, task, file, images, content, aigcLog, shouldUploadAIGC, taskId, navigate, haptic]);



    // 9. 成功提交后删除草稿
  const originalHandleSubmit = handleSubmit; // 保存原来的提交函数
  const enhancedHandleSubmit = useCallback(async (e) => {
    const result = await originalHandleSubmit(e);
    
    // 如果提交成功，删除草稿
    if (result !== false) { // 假设提交失败时返回false
      await deleteDraft();
    }
    
    return result;
  }, [originalHandleSubmit, deleteDraft]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">加载任务中...</p>
        </motion.div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <FormCard className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 dark:text-red-400 text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            任务不存在
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            请检查任务链接是否正确
          </p>
          <SecondaryButton
            onClick={() => navigate('/student')}
            icon="👈"
            fullWidth
          >
            返回任务列表
          </SecondaryButton>
        </FormCard>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-xl mx-auto">
          <FormCard>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                  📤 提交作业
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {task.title}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white text-xl">📝</span>
              </div>
            </motion.div>

            {task.description && (
              <NotificationCard type="info" className="mb-6">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-blue-600 dark:text-blue-400 text-lg">📋</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      任务说明
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {task.description}
                    </p>
                  </div>
                </div>
              </NotificationCard>
            )}
  
            <NotificationCard type="success" className="mb-6">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-green-600 dark:text-green-400 text-lg">✅</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1">已提交</p>
                  <p className="text-sm leading-relaxed">
                    你已提交此任务，无法重复提交。
                  </p>
                </div>
              </div>
            </NotificationCard>

            <SecondaryButton
              onClick={() => {
                haptic.light();
                navigate('/student');
              }}
              icon="👈"
              fullWidth
            >
              返回任务列表
            </SecondaryButton>
          </FormCard>
        </div>
      </div>
    );
  }

  // 🎯 AIGC 全屏模式组件 - 原生应用级设计
  if (isFullscreen) {
      return (
        <div className={`fixed inset-0 z-[9999] flex flex-col ${
          isMobile 
            ? 'bg-gradient-to-br from-[#fefdfb] via-[#fefcf9] to-[#fdf8f0] dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:via-[#1c1c1c] dark:to-[#1e1e1e]' 
            : 'bg-white dark:bg-gray-900'
        }`}>
          {/* 顶部导航栏 - 原生应用级隐身设计 */}
          <div className={`flex-shrink-0 backdrop-blur-xl border-b safe-area-inset-top ${
            isMobile 
              ? 'bg-white/80 dark:bg-[#1a1a1a]/90 border-gray-200/40 dark:border-[#2a2a2a]/30 px-4 py-2' 
              : 'bg-white/95 dark:bg-gray-900/95 border-gray-200/60 dark:border-gray-700/60 px-4 py-4'
          }`}>
            <div className={`flex items-center justify-between ${isMobile ? 'h-10' : 'max-w-4xl mx-auto'}`}>
              {/* 左侧区域 */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* 字号按钮 - 完全隐身的原生设计 */}
                <button
                  onClick={handleFontSizeClick}
                  className={`transition-all duration-200 active:scale-95 ${
                    isMobile 
                      ? 'w-9 h-9 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/8 dark:active:bg-white/8 rounded-full flex items-center justify-center border-0 outline-none focus:outline-none focus:ring-0 aigc-native-button'
                      : 'w-12 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center hover:shadow-lg'
                  }`}
                  title="调整字号"
                >
                  <div className={`flex items-baseline gap-0.5 ${
                    isMobile 
                      ? 'text-gray-600 dark:text-gray-300'
                      : 'text-white'
                  }`}>
                    <span className="text-xs font-semibold">A</span>
                    <span className="text-sm font-semibold">A</span>
                  </div>
                </button>
                
                {/* 标题和模型选择 - 移动端完全隐身的响应式设计 */}
                {isMobile ? (
                  <select
                    ref={selectRef}
                    value={model}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setModel(newModel);
                      haptic.light();
                      
                      requestAnimationFrame(() => {
                        if (selectRef.current) {
                          updateSelectWidth(selectRef.current);
                        }
                      });
                    }}
                    className="bg-transparent border-0 text-base font-medium text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-0 cursor-pointer appearance-none hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/8 dark:active:bg-white/8 outline-none ring-0 rounded-lg px-2 py-1 transition-all duration-200 aigc-native-select"
                    style={{
                      maxWidth: `calc(100vw - 180px)`,
                      paddingRight: '20px',
                      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='${document.documentElement.classList.contains('dark') ? '%23FFFFFF' : '%236B7280'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 4px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                      width: 'auto',
                      minWidth: 'auto',
                      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {MODEL_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  // 桌面端保持原有逻辑但更新显示文本
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">
                      AIGC
                    </h3>
                    <div className="md:flex md:items-center md:gap-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {getCurrentModelLabel(model)}
                      </p>
                      <span className="hidden md:inline text-gray-400">·</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(() => {
                          const currentFontConfig = FontSizeManager.getSizeConfig(fontSizeKey);
                          return `${currentFontConfig.label} ${currentFontConfig.size}px`;
                        })()}
                      </p>
                    </div>
                  </div>
                )}

              </div>
              
              {/* 右侧：模型选择器和关闭按钮 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {!isMobile && (
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    haptic.light();
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 max-w-[120px]"
                >
                  {MODEL_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                )}
                
                {/* 关闭按钮 - 完全隐身的原生设计 */}
                <button
                  onClick={() => {
                    haptic.light();
                    setIsFullscreen(false);
                  }}
                  className={`transition-all duration-200 active:scale-95 ${
                    isMobile 
                      ? 'w-9 h-9 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/8 dark:active:bg-white/8 rounded-full flex items-center justify-center border-0 outline-none focus:outline-none focus:ring-0 aigc-native-button'
                      : '!w-10 !h-10 !p-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex items-center justify-center'
                  }`}
                >
                  <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600 dark:text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 对话内容区域 - 统一的灰黑色调 */}
          <div
            ref={chatBoxRef}
            className={`flex-1 overflow-y-auto aigc-chat-content ${
              isMobile 
                ? 'bg-gradient-to-br from-[#fefdfb] via-[#fefcf9] to-[#fdf8f0] dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:via-[#1c1c1c] dark:to-[#1e1e1e]'
                : 'bg-white dark:bg-gray-900'
            }`}
            style={{
              paddingBottom: `calc(80px + env(safe-area-inset-bottom, 0px) + ${keyboardState.isOpen ? keyboardState.height : 0}px)`,
            }}
          >
            <div className={isMobile ? 'px-3 py-4' : 'max-w-4xl mx-auto px-4 py-6'}>
              {aigcLog.length === 0 && (
                <motion.div 
                  className="flex flex-col items-center justify-center min-h-[50vh] text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-4`}>
                    <span className={`${isMobile ? 'text-3xl' : 'text-4xl'}`}>🧠</span>
                  </div>
                  <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-medium text-gray-900 dark:text-gray-100 mb-3`}>
                    开始Thinking.
                  </h3>
                  <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-sm' : 'max-w-md'} leading-relaxed`}>
                    构建你的Thinking Chain。
                  </p>
                </motion.div>
              )}

              <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
                {aigcLog.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={msg.role === 'user' ? 'flex justify-end' : ''}
                  >
                    {msg.role === 'user' ? (
                      // 🎯 用户消息 - 移动端和桌面端不同样式
                      <div className={isMobile ? 'max-w-[70%] min-w-0' : 'max-w-3xl min-w-0'}>
                        <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1 justify-end`}>
                          <span>👤</span>
                          <span>你</span>
                        </div>
                                                
                        <div className={`rounded-2xl rounded-br-md border shadow-sm ${
                          isMobile 
                            ? 'bg-white dark:bg-black text-gray-900 dark:text-gray-100 border-gray-200/50 dark:border-gray-700/30 px-3 py-2'
                            : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-br-md px-4 py-3'
                        }`}>
                          <div className={`${isMobile ? 'text-sm' : 'text-base'} leading-normal break-words`}>
                            <ReactMarkdown
                              components={getMarkdownComponents(msg.role === 'user')}
                              remarkPlugins={[remarkGfm]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 🎯 AIGC消息 - 移动端无气泡，桌面端有气泡
                      <div className={isMobile ? 'w-full' : 'max-w-3xl'}>
                        {!isMobile && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                            <span>🤖</span>
                            <span>{msg.model === 'qwen' ? '通义千问' : 'ChatGPT'}</span>
                          </div>
                        )}
                        
                        <div className={isMobile 
                          ? 'py-2 border-l-2 border-gray-200/30 dark:border-gray-600/30 pl-3'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-600 shadow-sm'
                        }>
                          <div className={`${isMobile ? 'text-sm' : 'text-base'} leading-relaxed break-words`}>
                            <ReactMarkdown
                              components={getMarkdownComponents(msg.role === 'user')}
                              remarkPlugins={[remarkGfm]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={isMobile ? 'w-full' : 'flex justify-start'}
                  >
                    <div className={isMobile ? 'py-2' : 'max-w-3xl'}>
                      {!isMobile && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                          <span>🤖</span>
                          <span>{model === 'qwen' ? '通义千问' : 'ChatGPT'}</span>
                        </div>
                      )}
                      <div className={isMobile 
                        ? 'border-l-2 border-gray-200/30 dark:border-gray-600/30 pl-3'
                        : 'bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-600'
                      }>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">正在回复...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* 输入区域 - 原生应用级一体化设计 */}
          <div 
            className={`flex-shrink-0 backdrop-blur-xl border-t safe-area-inset-bottom ${
              isMobile 
                ? 'bg-white/80 dark:bg-[#1a1a1a]/90 border-gray-200/40 dark:border-[#2a2a2a]/30 px-4 py-3'
                : 'bg-white/95 dark:bg-gray-900/95 border-gray-200/60 dark:border-gray-700/60 p-4'
            }`}
            style={{
              transform: `translateY(${keyboardState.isOpen && deviceInfo.isMobile ? `-${keyboardState.height}px` : '0'})`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <div className={!isMobile ? 'max-w-4xl mx-auto' : ''}>
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      requestAnimationFrame(() => {
                        adjustTextareaHeight();
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !loading) {
                        e.preventDefault();
                        handleAIGCSubmit();
                      }
                    }}
                    placeholder="输入你的思考..."
                    disabled={loading}
                    rows={1}
                    className={`w-full resize-none rounded-3xl placeholder-gray-400 dark:placeholder-gray-500 pr-14 px-4 py-3 transition-all duration-200 aigc-native-input ${
                      isMobile 
                        ? 'border border-gray-300/30 dark:border-gray-600/30 bg-white/10 dark:bg-white/10 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50'
                        : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500'
                    }`}
                    style={{ 
                      minHeight: '44px',
                      maxHeight: isMobile ? '100px' : '120px',
                      overflow: 'hidden',
                    }}
                  />
                  
                  <button
                    type="button"
                    onClick={() => {
                      haptic.medium();
                      handleAIGCSubmit();
                    }}
                    disabled={loading || !input.trim()}
                    className={`absolute right-2 w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center aigc-native-button ${
                      !loading && input.trim()
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 active:scale-95 shadow-lg' 
                        : isMobile 
                          ? 'bg-white/5 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-600/20 dark:border-gray-600/20'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                    style={{
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {!isMobile && (
                <div className="flex justify-center items-center mt-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    按 Enter 发送，Shift + Enter 换行
                  </p>
                </div>
              )}
            </div>
          </div>

          <FontSizeSelector
            isOpen={showFontSelector}
            onClose={handleCloseFontSelector}
          />
        </div>
      );
    }
  // 🎯 主页面内容
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-6 px-4 sm:px-6">
      {/* 草稿恢复对话框 */}
      <DraftRestoreDialog
        isOpen={showRestoreDialog}
        draftData={draftData}
        onRestore={handleRestoreDraft}
        onIgnore={ignoreDraft}
      />

      {/* 离开页面提醒对话框 */}
      <BeforeUnloadDialog
        isOpen={showBeforeUnloadDialog}
        hasFile={!!file}
        onSaveAndLeave={handleSaveAndLeave}
        onLeaveWithoutSave={handleLeaveWithoutSave}
        onCancel={handleCancelLeave}
      />

      <div className="max-w-2xl mx-auto">
        {/* 修改现有的返回按钮区域，添加草稿保存指示器 */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 使用现有的 SecondaryButton 组件保持样式一致 */}
          <SecondaryButton
            onClick={handleBackClick} // 使用新的处理函数
            icon="👈"
            className="flex-shrink-0"
          >
            返回
          </SecondaryButton>

          {/* 草稿保存指示器 */}
          <DraftSaveIndicator
            saveStatus={saveStatus}
            onManualSave={handleManualSave}
          />
        </motion.div>

        {/* 主内容卡片 */}
        <FormCard>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                📤 提交作业
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 truncate">
                {task.title}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-xl">📝</span>
            </div>
          </motion.div>

          {/* 任务描述 */}
          {task.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <NotificationCard type="info" className="mb-6">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-blue-600 dark:text-blue-400 text-lg">📋</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      任务说明
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {task.description}
                    </p>
                  </div>
                </div>
              </NotificationCard>
            </motion.div>
          )}

          {/* 任务状态提醒 */}
          {taskStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NotificationCard 
                type={
                  taskStatus.isLate
                    ? taskStatus.canSubmit ? 'warning' : 'error'
                    : 'info'
                } 
                className="mb-6"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-lg">
                    {taskStatus.isLate
                      ? taskStatus.canSubmit ? '⚠️' : '❌'
                      : '✅'
                    }
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">
                      {taskStatus.isLate
                        ? taskStatus.canSubmit
                          ? '逾期提交提醒'
                          : '任务已截止'
                        : '任务进行中'
                      }
                    </p>
                    <p className="text-sm leading-relaxed">
                      {taskStatus.isLate
                        ? taskStatus.canSubmit
                          ? `${taskStatus.message}，仍可提交但将被标注为逾期作业`
                          : taskStatus.message
                        : taskStatus.message
                      }
                    </p>
                  </div>
                </div>
              </NotificationCard>
            </motion.div>
          )}

          {/* 任务信息卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl p-4 mb-6 border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span>📊</span>
              任务要求
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📁 类型</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">{task.category}</div>
              </div>
              <div className="text-center p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📝 文件</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">{task.needsFile ? '必交' : '可选'}</div>
              </div>
              <div className="text-center p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">🤖 AIGC</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">{task.allowAIGC ? '允许' : '禁止'}</div>
              </div>
              <div className="text-center p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">⏰ 截止</div>
                <div className="font-medium text-gray-800 dark:text-gray-200 text-xs">{formatDeadline}</div>
              </div>
            </div>
            
            {/* 额外信息 */}
            {task.allowAIGC && (
              <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">📝 AIGC 记录：</span>
                  <span className={`font-medium ${task.requireAIGCLog ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {task.requireAIGCLog ? '必交' : '可选'}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">📋 逾期提交：</span>
                <span className={`font-medium ${task.allowLateSubmission ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {task.allowLateSubmission ? '允许' : '不允许'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* 表单内容 */}
          {taskStatus?.canSubmit ? (
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* 文本内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  💬 文字内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入你的作业内容..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-4 py-3 text-base resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  请根据教师要求填写
                </p>
              </div>

              {/* 图片上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📷 上传图片 <span className="text-gray-500">(可选，支持多选)</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  支持 JPG、PNG、GIF 等图片格式，可同时选择多张图片
                </p>
                {renderImagePreview}
              </div>

              {/* 文件上传 */}
              {task.needsFile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📎 作业文件 <span className="text-red-500">*必交</span>
                  </label>
                  <input
                    type="file"
                    onChange={(e) => {
                      setFile(e.target.files[0]);
                      if (e.target.files[0]) haptic.light();
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    required={task.needsFile}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    请上传作业相关的文档、代码等文件
                  </p>
                </div>
              )}

              {/* AIGC 对话区域 - 非全屏模式 */}
              {task.allowAIGC && (
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/30 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">💡</span>
                      </div>
                      <div>
                        <label className="font-semibold text-gray-700 dark:text-gray-200">
                          AIGC对话
                        </label>
                        {task.requireAIGCLog && (
                          <span className="ml-2 text-red-500 text-sm">（必交）</span>
                        )}
                      </div>
                    </div>

                    <PrimaryButton
                      type="button"
                      size="sm"
                      onClick={() => {
                        haptic.medium();
                        setIsFullscreen(true);
                      }}
                      icon="⛶"
                    >
                      全屏
                    </PrimaryButton>
                  </div>

                  {/* 模型选择 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      选择 AI 模型
                    </label>
                    <select
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        haptic.light();
                      }}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                    >
                      <option value="openai">ChatGPT*(维护中)</option>
                      <option value="qwen">通义千问</option>
                    </select>
                  </div>

                  {/* 对话区域 */}
                  <div
                    ref={chatBoxRef}
                    className="bg-gray-50/80 dark:bg-gray-800/50 h-64 rounded-lg border border-gray-200/50 dark:border-gray-600/50 p-4 mb-4 overflow-y-auto"
                  >
                    {aigcLog.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <div className="text-3xl mb-2">🧠</div>
                          <p className="text-sm">开始构建你的Thinking</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {aigcLog.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="max-w-[80%]">
                              <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1 ${
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}>
                                <span>{msg.role === 'user' ? '👤' : '🤖'}</span>
                                <span>{msg.role === 'user' ? '你' : (msg.model === 'qwen' ? '通义千问' : 'ChatGPT')}</span>
                              </div>
                              
                              <div className={`rounded-xl px-3 py-2 text-sm ${
                                msg.role === 'user' 
                                  ? 'bg-blue-500 text-white rounded-br-sm' 
                                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600'
                              }`}>
                                <ReactMarkdown
                                  components={getMarkdownComponents(msg.role === 'user')}
                                  remarkPlugins={[remarkGfm]}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}

                        {loading && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%]">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <span>🤖</span>
                                <span>{model === 'qwen' ? '通义千问' : 'ChatGPT'}</span>
                              </div>
                              <div className="bg-white dark:bg-gray-700 rounded-xl rounded-bl-sm px-3 py-2 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">正在回复...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 输入区域 */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value);
                          requestAnimationFrame(() => {
                            adjustTextareaHeight();
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !loading) {
                            e.preventDefault();
                            handleAIGCSubmit();
                          }
                        }}
                        placeholder="输入你的问题..."
                        disabled={loading}
                        rows={1}
                        className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 pr-12 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                        style={{ 
                          minHeight: '44px',
                          maxHeight: '88px',
                          overflow: 'hidden',
                        }}
                      />
                      
                      <button
                        type="button"
                        onClick={() => {
                          haptic.medium();
                          handleAIGCSubmit();
                        }}
                        disabled={loading || !input.trim()}
                        className={`absolute right-2 w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${
                          !loading && input.trim()
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 active:scale-95' 
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)',
                          marginTop: '0'
                        }}
                      >
                        {loading ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AIGC可选上传选项 */}
              {task.allowAIGC && !task.requireAIGCLog && aigcLog.length > 0 && (
                <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/30">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldUploadAIGC}
                      onChange={(e) => {
                        setShouldUploadAIGC(e.target.checked);
                        haptic.light();
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        同时上传我的AIGC对话记录
                      </span>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        可选项，勾选后将把你与AI的完整对话记录一起提交给老师
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="pt-4">
                {taskStatus?.isLate ? (
                  <WarningButton
                    type="submit"
                    size="lg"
                    fullWidth
                    icon="⚠️"
                    haptic
                    disabled={loading}
                  >
                    逾期提交作业
                  </WarningButton>
                ) : (
                  <PrimaryButton
                    type="submit"
                    size="lg"
                    fullWidth
                    icon="📤"
                    haptic
                    disabled={loading}
                  >
                    提交作业
                  </PrimaryButton>
                )}
              </div>

              {/* 消息提示 */}
              {message && (
                <NotificationCard
                  type={
                    message.startsWith('✅') ? 'success' :
                    message.startsWith('⚠️') ? 'warning' :
                    message.startsWith('📤') ? 'info' : 'error'
                  }
                  className="mt-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {message}
                    </span>
                  </div>
                </NotificationCard>
              )}
            </motion.form>
          ) : (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center border border-red-200 dark:border-red-700/50">
                <span className="text-red-600 dark:text-red-400 text-3xl">❌</span>
              </div>
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                任务已截止
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                无法提交作业，请联系老师了解详情
              </p>
              <SecondaryButton
                onClick={() => {
                  haptic.light();
                  navigate('/student');
                }}
                icon="👈"
              >
                返回任务列表
              </SecondaryButton>
            </motion.div>
          )}
        </FormCard>
      </div>
    </div>
    
  );
  
};

export default SubmitTask;