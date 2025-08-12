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
import { PrimaryButton, SecondaryButton, WarningButton } from '../components/EnhancedButton';
import LazyImageGrid from '../components/LazyImageGrid';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);

const SubmitTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
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

  const [viewportInfo, setViewportInfo] = useState(() => ({
    height: window.innerHeight,
    visualHeight: window.visualViewport?.height || window.innerHeight,
    isKeyboardOpen: false,
    keyboardHeight: 0
  }));

  const chatBoxRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('hideFeedback', isFullscreen ? '1' : '0');
    const event = new Event('toggleFeedback');
    window.dispatchEvent(event);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => (document.body.style.overflow = '');
  }, [isFullscreen]);

  useEffect(() => {
    let rafId = null;
    let scrollTimeout = null;
    
    const updateViewport = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        const windowHeight = window.innerHeight;
        const visualHeight = window.visualViewport?.height || windowHeight;
        const keyboardHeight = Math.max(0, windowHeight - visualHeight);
        const isKeyboardOpen = keyboardHeight > 50;
        
        setViewportInfo({
          height: windowHeight,
          visualHeight,
          isKeyboardOpen,
          keyboardHeight
        });

        if (isKeyboardOpen && isFullscreen) {
          document.body.style.position = 'fixed';
          document.body.style.top = '0';
          document.body.style.left = '0';
          document.body.style.right = '0';
          document.body.style.bottom = '0';
          document.body.style.overflow = 'hidden';
          
          if (scrollTimeout) {
            clearTimeout(scrollTimeout);
          }
          
          scrollTimeout = setTimeout(() => {
            if (!isKeyboardOpen) {
              document.body.style.position = '';
              document.body.style.top = '';
              document.body.style.left = '';
              document.body.style.right = '';
              document.body.style.bottom = '';
              document.body.style.overflow = isFullscreen ? 'hidden' : '';
            }
          }, 300);
        } else if (!isKeyboardOpen) {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.left = '';
          document.body.style.right = '';
          document.body.style.bottom = '';
          document.body.style.overflow = isFullscreen ? 'hidden' : '';
        }
      });
    };

    updateViewport();

    const events = ['resize', 'orientationchange'];
    events.forEach(event => {
      window.addEventListener(event, updateViewport, { passive: true });
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      events.forEach(event => {
        window.removeEventListener(event, updateViewport);
      });
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
      }
      
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
      document.body.style.overflow = '';
    };
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

  // 🎯 优化任务状态检查，使用 useMemo 缓存计算结果
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

  // 🚀 优化 AIGC 提交，记录模型信息
  const handleAIGCSubmit = useCallback(async () => {
    if (!input.trim()) return;

    // 用户消息也记录当前模型（虽然用户消息不显示模型，但保持一致性）
    const userMessage = { role: 'user', content: input, model: model };
    setAigcLog((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/aigc/chat', {
        messages: [...aigcLog, userMessage],
        model,
      });

      // AI回复消息记录使用的模型
      const aiMessage = { 
        role: 'assistant', 
        content: res.data.reply, 
        model: model 
      };
      setAigcLog((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AIGC请求失败:', err);
      // 错误消息也记录模型
      const errorMessage = { 
        role: 'assistant', 
        content: '❌ AI 回复失败，请稍后重试',
        model: model 
      };
      setAigcLog((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, aigcLog, model]);

  // 🎯 优化图片处理
  const handleImageChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    setImages(selectedFiles);
  
    const previewIds = selectedFiles.map((file, index) => `preview_${Date.now()}_${index}`);
    setImagePreviewIds(previewIds);
  }, []);

  // 🚀 优化图片预览渲染
  const renderImagePreview = useMemo(() => {
    if (!images || images.length === 0) return null;
  
    return (
      <div className="mt-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📷 即将上传的图片预览 ({images.length} 张)
        </p>
        <div className="flex flex-wrap gap-2">
          {images.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`预览 ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer"
                   onClick={() => {
                     const newImages = images.filter((_, i) => i !== index);
                     setImages(newImages);
                     const newPreviewIds = imagePreviewIds.filter((_, i) => i !== index);
                     setImagePreviewIds(newPreviewIds);
                   }}>
                ×
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [images, imagePreviewIds]);

  // 改进的自动调整输入框高度函数
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 重置高度
    textarea.style.height = 'auto';
    
    // 计算新高度
    const minHeight = isFullscreen ? 56 : 44;
    const maxHeight = isFullscreen ? 120 : 44;
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [isFullscreen]);

  // 监听输入变化
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // 🚀 优化提交处理，添加乐观更新和错误处理
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setMessage('');

    if (!taskStatus?.canSubmit) {
      return setMessage(`❌ ${taskStatus.message}`);
    }

    // 验证提交内容
    if (task.needsFile && !file) {
      return setMessage('❌ 本任务要求上传作业文件。');
    }
    if (task.requireAIGCLog && (!aigcLog || aigcLog.length === 0)) {
      return setMessage('❌ 本任务要求上传 AIGC 原始记录，请先进行 AIGC 对话。');
    }
    if (!task.needsFile && (!images || images.length === 0) && !content.trim()) {
      return setMessage('❌ 请提交作业内容（文件、图片或文本）。');
    }

    // 🚀 乐观更新 - 立即显示提交状态
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

      // 🎯 预加载返回页面
      setTimeout(() => {
        api.get('/task/all?category=active').catch(() => {});
        navigate('/student');
      }, 2000);

    } catch (err) {
      console.error('提交失败:', err);
      setMessage(`❌ 提交失败：${err.response?.data?.message || err.message}`);
    }
  }, [taskStatus, task, file, images, content, aigcLog, shouldUploadAIGC, taskId, navigate]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-center text-gray-500 dark:text-gray-400">加载任务中...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-center text-gray-500 dark:text-gray-400">任务不存在</p>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl mx-auto">
          <FormCard className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 line-clamp-2">
                  📤 提交作业
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  {task.title}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-mobile flex-shrink-0">
                <span className="text-white text-xl">📝</span>
              </div>
            </div>

            {/* 📌 显示任务描述 */}
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
              onClick={() => navigate('/student')}
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-10 px-2 sm:px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-4 sm:mb-6">
          <SecondaryButton
            size="sm"
            onClick={() => navigate('/student')}
            icon="👈"
            className="w-full sm:w-auto"
          >
            返回任务列表
          </SecondaryButton>
        </div>

        {/* 主内容卡片 */}
        <FormCard className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 line-clamp-2">
                📤 提交作业
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                {task.title}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-mobile flex-shrink-0">
              <span className="text-white text-xl">📝</span>
            </div>
          </div>

          {/* 任务描述 */}
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

          {/* 任务状态提醒 */}
          {taskStatus && (
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
          )}

          {/* 任务信息卡片 */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-mobile-xl p-4 mb-6 border border-gray-200/50 dark:border-gray-700/50">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span>📊</span>
              任务要求
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-2 bg-white/60 dark:bg-gray-700/60 rounded-mobile-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📁 类型</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">{task.category}</div>
              </div>
              <div className="text-center p-2 bg-white/60 dark:bg-gray-700/60 rounded-mobile-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📝 文件</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">{task.needsFile ? '必交' : '可选'}</div>
              </div>
              <div className="text-center p-2 bg-white/60 dark:bg-gray-700/60 rounded-mobile-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">🤖 AIGC</div>
                <div className="font-medium text-gray-800 dark:text-gray-200">{task.allowAIGC ? '允许' : '禁止'}</div>
              </div>
              <div className="text-center p-2 bg-white/60 dark:bg-gray-700/60 rounded-mobile-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">⏰ 截止</div>
                <div className="font-medium text-gray-800 dark:text-gray-200 text-xs">{formatDeadline}</div>
              </div>
            </div>
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
          </div>

          {/* 只有在可以提交时才显示表单 */}
          {taskStatus?.canSubmit ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 文本提交框 */}
              <div>
                <label className="mobile-form-label">
                  💬 文字内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入你的作业内容..."
                  className="mobile-form-input resize-none focus:ring-blue-500/50 focus:border-blue-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  可以输入文字作业、总结、心得等内容
                </p>
              </div>

              {/* 图片上传功能 */}
              <div>
                <label className="mobile-form-label">
                  📷 上传图片 <span className="text-gray-500">(可选，支持多选)</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mobile-form-input focus:ring-blue-500/50 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  支持 JPG、PNG、GIF 等图片格式，可同时选择多张图片
                </p>
                {renderImagePreview}
              </div>

              {/* 文件上传 */}
              {task.needsFile && (
                <div>
                  <label className="mobile-form-label">
                    📎 作业文件 <span className="text-red-500">*必交</span>
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="mobile-form-input focus:ring-blue-500/50 focus:border-blue-500"
                    required={task.needsFile}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    请上传作业相关的文档、代码等文件
                  </p>
                </div>
              )}

              {/* AIGC 对话区域 - 完整保留原有功能但优化样式 */}
              {task.allowAIGC && (
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-mobile-2xl border border-purple-200/50 dark:border-purple-700/30">
                  <AnimatePresence mode="wait">
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`${
                        isFullscreen
                          ? 'fixed inset-0 w-screen z-[9999] bg-white dark:bg-gray-900 flex flex-col overflow-hidden'
                          : 'rounded-2xl p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md space-y-3 relative'
                      }`}
                      style={isFullscreen ? { 
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        paddingTop: 'env(safe-area-inset-top)',
                        paddingBottom: '0',
                        zIndex: 9999,
                        margin: 0,
                      } : {}}
                    >
                      {/* 全屏模式的顶部导航栏 - 优化样式 */}
                      {isFullscreen && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 px-4 sm:px-6 py-4 safe-area-inset-top shadow-mobile"
                        >
                          <div className="flex items-center justify-between max-w-4xl mx-auto">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-mobile">
                                <span className="text-white text-lg font-bold">🤖</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                  AIGC 助手
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {model === 'qwen' ? '通义千问' : 'ChatGPT'}
                                  {task.requireAIGCLog && <span className="ml-2 text-red-500">（必交）</span>}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* 模型切换 - 优化样式 */}
                              <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="mobile-form-input !min-h-[36px] !py-1.5 !px-3 text-sm w-auto focus:ring-purple-500/50 focus:border-purple-500"
                              >
                                <option value="openai">ChatGPT*(维护中)</option>
                                <option value="qwen">通义千问</option>
                              </select>
                              
                              {/* 退出按钮 - 优化样式 */}
                              <SecondaryButton
                                size="sm"
                                onClick={() => setIsFullscreen(false)}
                                icon="✕"
                                className="!w-10 !h-10 !min-w-[40px] !p-0"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* 非全屏模式的标题栏 - 优化样式 */}
                      {!isFullscreen && (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-mobile-xl p-4 border border-gray-200/50 dark:border-gray-700/50 mb-3">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">🤖</span>
                              </div>
                              <div>
                                <label className="font-semibold text-gray-700 dark:text-gray-200">
                                  💬 AIGC 对话助手
                                </label>
                                {task.requireAIGCLog && (
                                  <span className="ml-2 text-red-500 text-sm font-normal">（必交）</span>
                                )}
                              </div>
                            </div>

                            <PrimaryButton
                              size="sm"
                              onClick={() => setIsFullscreen(true)}
                              icon="⛶"
                              variant="outline"
                            >
                              全屏
                            </PrimaryButton>
                          </div>

                          {/* 模型选择 - 优化样式 */}
                          <div>
                            <label className="mobile-form-label !mb-1">
                              选择 AI 模型
                            </label>
                            <select
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              className="mobile-form-input !min-h-[40px] focus:ring-purple-500/50 focus:border-purple-500"
                            >
                              <option value="openai">ChatGPT*(维护中)</option>
                              <option value="qwen">通义千问</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* 对话内容区域 - 保持原有完整功能 */}
                      <div
                        ref={chatBoxRef}
                        className={`flex-1 overflow-y-auto scroll-smooth-mobile ${
                          isFullscreen
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-gray-50/80 dark:bg-gray-800/50 h-40 sm:h-52 md:h-64 rounded-mobile-lg border border-gray-200/50 dark:border-gray-600/50 p-3'
                        }`}
                        style={isFullscreen ? {
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgb(156 163 175) transparent',
                          flex: 1,
                          minHeight: 0,
                          paddingBottom: `calc(70px + env(safe-area-inset-bottom, 0px))`,
                          height: `calc(100vh - 140px - env(safe-area-inset-top, 0px))`,
                        } : {}}
                      >
                        {/* 保持原有的完整对话功能代码 */}
                        <div className={isFullscreen ? 'max-w-4xl mx-auto px-4 sm:px-6 py-6' : ''}>
                          {/* 欢迎消息（仅全屏模式且无对话时）- 优化样式 */}
                          {isFullscreen && aigcLog.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6 shadow-mobile">
                                <span className="text-4xl">🤖</span>
                              </div>
                              <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3">
                                开始与 AI 对话
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                                向 AI 提问，获得学习帮助和指导
                              </p>
                            </div>
                          )}

                          {/* 对话消息列表 - 保持原有功能 */}
                          <div className={`space-y-4 ${isFullscreen ? 'min-h-0 pb-32' : ''}`}>
                            {aigcLog.map((msg, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[85%] ${isFullscreen ? 'max-w-3xl' : ''} min-w-0`}>
                                  {/* 发言者标识 - 优化样式 */}
                                  <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1 ${
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                  }`}>
                                    <span>{msg.role === 'user' ? '👤' : '🤖'}</span>
                                    <span>{msg.role === 'user' ? '你' : (msg.model === 'qwen' ? '通义千问' : 'ChatGPT')}</span>
                                  </div>
                                  
                                  {/* 消息气泡 - 保持原有功能但优化样式 */}
                                  <div className={`rounded-2xl px-4 py-3 shadow-mobile ${
                                    msg.role === 'user' 
                                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md' 
                                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-600'
                                  }`}>
                                    <div className={`${isFullscreen ? 'text-base leading-relaxed' : 'text-sm'} break-words overflow-x-auto`}>
                                      {/* 保持原有的 ReactMarkdown 渲染功能 */}
                                      <ReactMarkdown
                                        components={{
                                          code({ inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline ? (
                                              <div className="overflow-x-auto my-2">
                                                <SyntaxHighlighter
                                                  style={github}
                                                  language={match ? match[1] : 'text'}
                                                  PreTag="div"
                                                  className={`rounded-lg ${
                                                    isFullscreen ? 'text-sm leading-relaxed' : 'text-xs'
                                                  }`}
                                                  customStyle={{
                                                    margin: 0,
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    fontSize: isFullscreen ? '14px' : '12px',
                                                    lineHeight: '1.5',
                                                    overflowX: 'auto',
                                                    whiteSpace: 'pre',
                                                    wordBreak: 'normal',
                                                    wordWrap: 'normal',
                                                  }}
                                                  {...props}
                                                >
                                                  {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                              </div>
                                            ) : (
                                              <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                                msg.role === 'user' 
                                                  ? 'bg-blue-400 text-white' 
                                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                                              }`}>
                                                {children}
                                              </code>
                                            );
                                          },
                                          pre({ children, ...props }) {
                                            return (
                                              <pre className="overflow-x-auto whitespace-pre-wrap break-words" {...props}>
                                                {children}
                                              </pre>
                                            );
                                          },
                                          table({ children, ...props }) {
                                            return (
                                              <div className="overflow-x-auto my-2">
                                                <table className="border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                                                  {children}
                                                </table>
                                              </div>
                                            );
                                          }
                                        }}
                                      >
                                        {msg.content}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}

                            {/* 加载状态 - 优化样式 */}
                            {loading && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                              >
                                <div className="max-w-[85%]">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                    <span>🤖</span>
                                    <span>{model === 'qwen' ? '通义千问' : 'ChatGPT'}</span>
                                  </div>
                                  <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-600 shadow-mobile">
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

                      {/* 输入区域 - 保持原有的键盘处理功能但优化样式 */}
                      <div 
                        className={`flex-shrink-0 ${
                          isFullscreen 
                            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/60' 
                            : 'mt-2 bg-transparent'
                        }`}
                        style={isFullscreen ? {
                          position: 'fixed',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 10000,
                          paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
                          paddingTop: '1rem',
                          paddingLeft: '1rem',
                          paddingRight: '1rem',
                          maxWidth: '56rem',
                          marginLeft: 'auto',
                          marginRight: 'auto',
                          transform: `translate3d(0, ${viewportInfo.isKeyboardOpen ? `-${viewportInfo.keyboardHeight}px` : '0'}, 0)`,
                          transition: 'transform 0.3s ease-out',
                        } : {}}
                      >
                        <style jsx>{`
                          [data-theme="fullscreen"] {
                            background-color: rgba(255, 255, 255, 0.95) !important;
                          }
                          .dark [data-theme="fullscreen"] {
                            background-color: rgba(17, 24, 39, 0.95) !important;
                          }
                        `}</style>
                        
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
                              className={`mobile-form-input resize-none !border-gray-300 dark:!border-gray-600 
                                        !bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100
                                        !pr-16 focus:!ring-purple-500/50 focus:!border-purple-500
                                        transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500
                                        ${isFullscreen ? '!text-base !leading-relaxed' : '!text-sm'}
                                        disabled:!bg-gray-100 dark:disabled:!bg-gray-700 disabled:cursor-not-allowed`}
                              style={{ 
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                lineHeight: '1.5',
                                minHeight: isFullscreen ? '56px' : '44px',
                                maxHeight: isFullscreen ? '120px' : '44px',
                                overflow: 'hidden',
                                WebkitAppearance: 'none',
                                borderRadius: '24px',
                                padding: `${isFullscreen ? '16px' : '12px'} 56px ${isFullscreen ? '16px' : '12px'} 20px`,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            />
                            
                            {/* 发送按钮 - 保持原有功能但优化样式 */}
                            <button
                              type="button"
                              onClick={handleAIGCSubmit}
                              disabled={loading || !input.trim()}
                              className={`absolute w-10 h-10 rounded-full transition-all duration-200
                                        flex items-center justify-center flex-shrink-0 shadow-mobile
                                        ${!loading && input.trim()
                                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-purple-500/25' 
                                          : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        }`}
                              style={{
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 1,
                              }}
                            >
                              {loading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg 
                                  className="w-4 h-4" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* 提示文字 - 优化样式 */}
                        {isFullscreen && (
                          <div className="hidden sm:flex justify-center items-center mt-3">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              按 Enter 发送，Shift + Enter 换行
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* AIGC可选上传选项 */}
              {task.allowAIGC && !task.requireAIGCLog && aigcLog.length > 0 && (
                <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-mobile-lg p-4 border border-blue-200/50 dark:border-blue-700/30">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldUploadAIGC}
                      onChange={(e) => setShouldUploadAIGC(e.target.checked)}
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
                    gradient
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
                    gradient
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
            </form>
          ) : (
            <div className="text-center py-12">
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
                onClick={() => navigate('/student')}
                icon="👈"
              >
                返回任务列表
              </SecondaryButton>
            </div>
          )}
        </FormCard>
      </div>
    </div>
  );
};

export default SubmitTask;