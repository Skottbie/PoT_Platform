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
import '../styles/aigcFontSize.css';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);

const SubmitTask = () => {
  const { currentSize, currentConfig } = useFontSize();
  const [showFontSelector, setShowFontSelector] = useState(false);
  
  const handleFontSizeClick = useCallback(() => {
    console.log('字号按钮被点击了'); // 添加这行调试
    haptic.light();
    setShowFontSelector(true);
  }, [haptic]);

  const handleCloseFontSelector = useCallback(() => {
    setShowFontSelector(false);
  }, []);

  const { taskId } = useParams();
  const navigate = useNavigate();
  
  // 🎯 设备检测和触觉反馈
  const deviceInfo = useDeviceDetection();
  const keyboardState = useVirtualKeyboard();
  const haptic = useHapticFeedback();

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


  // 引用
  const chatBoxRef = useRef(null);
  const textareaRef = useRef(null);

  // 添加完整的 Markdown 组件配置
  const getMarkdownComponents = (isUserMessage) => ({
    // 代码块处理
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <div className="overflow-x-auto my-3">
          <SyntaxHighlighter
            style={github}
            language={match ? match[1] : 'text'}
            PreTag="div"
            className="rounded-lg text-sm"
            customStyle={{
              margin: 0,
              padding: '12px',
              borderRadius: '8px',
              fontSize: 'var(--aigc-code-font-size)',
              lineHeight: '1.4',
              overflowX: 'auto',
              backgroundColor: isUserMessage ? 'rgba(59, 130, 246, 0.1)' : '#f6f8fa',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
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

    // 表格处理
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
        <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${
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

    // 列表处理
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

    li({ children }) {
      return (
        <li className="leading-relaxed">
          {children}
        </li>
      );
    },

    // 标题处理
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

    // 段落处理
    p({ children }) {
      return (
        <p className="my-2 leading-relaxed">
          {children}
        </p>
      );
    },

    // 引用块处理
    blockquote({ children }) {
      return (
        <blockquote className={`border-l-4 pl-4 py-2 my-3 rounded-r-lg ${
          isUserMessage 
            ? 'border-white/30 bg-white/10' 
            : 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
        }`}>
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

    // 链接处理
    a({ href, children }) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`hover:underline font-medium ${
            isUserMessage 
              ? 'text-white/90' 
              : 'text-blue-600 dark:text-blue-400'
          }`}
        >
          {children}
        </a>
      );
    },

    // 强调和加粗
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

    // 水平分割线
    hr() {
      return (
        <hr className={`my-4 ${
          isUserMessage 
            ? 'border-white/30' 
            : 'border-gray-300 dark:border-gray-600'
        }`} />
      );
    },

    // 图片处理
    img({ src, alt }) {
      return (
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full h-auto rounded-lg my-2 border border-gray-200 dark:border-gray-600"
          loading="lazy"
        />
      );
    },
  });

  

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

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

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

  // 🎯 AIGC 全屏模式组件 - 完全独立渲染
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 flex flex-col">
        {/* 顶部导航栏 - 修复移动端布局 */}
        <div className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 px-4 py-4 safe-area-inset-top">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* 左侧：字号按钮和标题 - 修复移动端布局 */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* 字号按钮 - 改进样式和图标 */}
              <button
                onClick={handleFontSizeClick}
                className="w-12 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 active:scale-95"
                title="调整字号"
              >
                <div className="flex items-baseline gap-0.5">
                  <span className="text-white text-xs font-bold">A</span>
                  <span className="text-white text-sm font-bold">A</span>
                </div>
              </button>
              
              {/* 标题和信息 - 移动端优化布局 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg truncate">
                  AIGC
                </h3>
                {/* 移动端分两行显示，桌面端一行显示 */}
                <div className="md:flex md:items-center md:gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {model === 'qwen' ? '通义千问' : 'ChatGPT'}
                  </p>
                  <span className="hidden md:inline text-gray-400">·</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentConfig.label} {currentConfig.size}px
                  </p>
                </div>
              </div>
            </div>
            
            {/* 右侧：模型选择和关闭按钮 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  haptic.light();
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 max-w-[120px]"
              >
                <option value="openai">ChatGPT*维护中</option>
                <option value="qwen">通义千问</option>
              </select>
              
              <IconButton
                onClick={() => {
                  haptic.light();
                  setIsFullscreen(false);
                }}
                icon="✕"
                variant="secondary"
                className="!w-10 !h-10 !p-0"
              />
            </div>
          </div>
        </div>
        
        <div>
        {/* 全屏内容 */}
        {/* 字号选择器也放在这里 */}
        <FontSizeSelector
          isOpen={showFontSelector}
          onClose={handleCloseFontSelector}
        />
        </div>

        {/* 对话内容区域 - 保持不变 */}
        <div
          ref={chatBoxRef}
          className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 aigc-chat-content"
          style={{
            paddingBottom: `calc(80px + env(safe-area-inset-bottom, 0px) + ${keyboardState.isOpen ? keyboardState.height : 0}px)`,
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-6">
            {aigcLog.length === 0 && (
              <motion.div 
                className="flex flex-col items-center justify-center min-h-[50vh] text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl">🤖</span>
                </div>
                <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3">
                  开始Thinking.
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                  构建你的Thinking Chain. AI友情客串。
                </p>
              </motion.div>
            )}

            <div className="space-y-4">
              {aigcLog.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-3xl min-w-0">
                    <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{msg.role === 'user' ? '👤' : '🤖'}</span>
                      <span>{msg.role === 'user' ? '你' : (msg.model === 'qwen' ? '通义千问' : 'ChatGPT')}</span>
                    </div>
                    
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md' 
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-600 shadow-sm'
                    }`}>
                      <div className="text-base leading-relaxed break-words">
                        <ReactMarkdown
                          components={getMarkdownComponents(msg.role === 'user')}
                          remarkPlugins={[remarkGfm]}
                        >
                          {msg.content}
                        </ReactMarkdown>

                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-3xl">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <span>🤖</span>
                      <span>{model === 'qwen' ? '通义千问' : 'ChatGPT'}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-600">
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

        {/* 输入区域 */}
        <div 
          className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/60 p-4 safe-area-inset-bottom"
          style={{
            transform: `translateY(${keyboardState.isOpen && deviceInfo.isMobile ? `-${keyboardState.height}px` : '0'})`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <div className="max-w-4xl mx-auto">
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
                  className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 pr-14 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
                  style={{ 
                    minHeight: '44px',
                    maxHeight: '120px',
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
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center ${
                    !loading && input.trim()
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 active:scale-95 shadow-lg' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  style={{
                    top: textareaRef.current ? `${textareaRef.current.scrollHeight / 2}px` : '50%',
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
            
            <div className="hidden sm:flex justify-center items-center mt-3">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                按 Enter 发送，Shift + Enter 换行
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎯 主页面内容
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <SecondaryButton
            size="sm"
            onClick={() => {
              haptic.light();
              navigate('/student');
            }}
            icon="👈"
            className="w-full sm:w-auto"
          >
            返回任务列表
          </SecondaryButton>
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
                          transform: 'translateY(-50%)'
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