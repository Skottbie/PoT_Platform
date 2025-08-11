// src/pages/SubmitTask.jsx

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
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

  const chatBoxRef = useRef(null);

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

  // 🚀 优化 AIGC 提交，添加防抖和重试机制
  const handleAIGCSubmit = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setAigcLog((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // 🎯 乐观更新 - 立即显示"AI思考中"
    const thinkingMessage = { role: 'assistant', content: '🤔 AI正在思考中...' };
    setAigcLog((prev) => [...prev, thinkingMessage]);

    try {
      const res = await api.post('/aigc/chat', {
        messages: [...aigcLog, userMessage],
        model,
      });
 
      // 替换思考消息为真实回复
      const aiMessage = { role: 'assistant', content: res.data.reply };
      setAigcLog((prev) => prev.slice(0, -1).concat(aiMessage));
    } catch (err) {
      console.error('AIGC请求失败:', err);
      // 替换思考消息为错误消息
      const errorMessage = { role: 'assistant', content: '❌ AI 回复失败，请稍后重试' };
      setAigcLog((prev) => prev.slice(0, -1).concat(errorMessage));
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            提交任务：{task.title}
          </h1>

          {/* 📌 显示任务描述 */}
          {task.description && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📋 任务说明
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}
 
          <p className="text-green-600 dark:text-green-400 text-sm mb-4">
            ✅ 你已提交此任务，无法重复提交。
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/student')}
          >
            ← 返回学生首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-10 px-2 sm:px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 - 修复位置 */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/student')}
            className="w-full sm:w-auto"
          >
            👈 返回学生首页
          </Button>
        </div>

        {/* 主内容卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 sm:p-8 relative transition-colors duration-300">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            提交任务：{task.title}
          </h1>

          {/* 📌 添加任务描述显示 */}
          {task.description && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📋 任务说明
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* 任务状态提醒 */}
          {taskStatus && (
            <div className={`mb-6 p-4 rounded-xl ${
              taskStatus.isLate
                ? taskStatus.canSubmit
                  ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
            }`}>
              <p className={`font-medium ${
                taskStatus.isLate
                  ? taskStatus.canSubmit
                    ? 'text-orange-700 dark:text-orange-300'
                    : 'text-red-700 dark:text-red-300'
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {taskStatus.isLate
                  ? taskStatus.canSubmit
                    ? `⚠️ ${taskStatus.message}，仍可提交但将被标注为逾期作业`
                    : `❌ ${taskStatus.message}`
                  : `✅ ${taskStatus.message}`
                }
              </p>
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-6">
            <p>📁 任务类型：{task.category}</p>
            <p>⏰ 截止时间：{formatDeadline}</p>
            <p>📝 作业文件：{task.needsFile ? '必交' : '可选'}</p>
            <p>🤖 AIGC 使用：{task.allowAIGC ? '允许' : '禁止'}</p>
            {task.allowAIGC && (
              <p>📝 AIGC 日志：{task.requireAIGCLog ? '必交' : '可选'}</p>
            )}
            <p>📋 逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}</p>
          </div>

          {/* 只有在可以提交时才显示表单 */}
          {taskStatus?.canSubmit ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 文本提交框 */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
                  提交文本内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入你的文字作业..."
                  className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 h-28"
                />
              </div>

              {/* 图片上传功能 */}
              <div>
                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
                  上传图片（可选，可多选）
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
                />
                {renderImagePreview}
              </div>

              {/* 文件上传 */}
              {task.needsFile && (
                <div>
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
                    作业文件（必传）
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
                    required={task.needsFile}
                  />
                </div>
              )}

              {/* AIGC 对话区域 */}
              {task.allowAIGC && (
                <AnimatePresence mode="wait">
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`border rounded-2xl p-4 bg-gray-50 dark:bg-gray-700 space-y-3
                      ${isFullscreen
                        ? 'fixed inset-0 w-full h-full z-[200] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 flex flex-col'
                        : 'relative'
                      }
                    `}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-semibold text-gray-700 dark:text-gray-200">
                        💬 AIGC 对话区
                        {task.requireAIGCLog && (
                          <span className="ml-2 text-red-500 text-sm font-normal">（必交）</span>
                        )}
                      </label>

                      <div className="flex gap-2">
                        {!isFullscreen && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsFullscreen(true)}
                          >
                            全屏
                          </Button>
                        )}

                        {isFullscreen && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsFullscreen(false)}
                          >
                            退出全屏
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 模型选择 */}
                    <div className="mb-2">
                      <label className="text-sm font-medium block mb-1 text-gray-600 dark:text-gray-300">
                        选择 AI 模型
                      </label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="border p-2 rounded-lg w-full bg-white dark:bg-gray-600 dark:text-gray-100"
                      >
                        <option value="openai">ChatGPT*(维护中)</option>
                        <option value="qwen">通义千问</option>
                      </select>
                    </div>

                    {/* 对话内容 */}
                    <div
                      ref={chatBoxRef}
                      className={`bg-white dark:bg-gray-600 border dark:border-gray-500 flex-1 p-3 rounded-lg overflow-y-auto space-y-2
                        ${isFullscreen
                          ? 'flex-1 text-base leading-relaxed px-2 sm:px-4 space-y-3'
                          : 'h-40 sm:h-52 md:h-64 text-sm leading-snug'
                        }
                      `}
                    >
                      {aigcLog.map((msg, idx) => (
                        <div key={idx}>
                          <strong
                            className={`${msg.role === 'user' ? 'text-blue-600' : 'text-green-600'}
                              ${isFullscreen ? 'text-lg block mb-1' : 'text-base'}
                            `}
                          >
                            {msg.role === 'user' ? '我：' : 'AI：'}
                          </strong>{' '}
                          <ReactMarkdown
                            className="inline"
                            components={{
                              code({ inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline ? (
                                  <SyntaxHighlighter
                                    style={github}
                                    language={match ? match[1] : 'text'}
                                    PreTag="div"
                                    className={`rounded-lg my-1 overflow-x-auto ${isFullscreen ? 'text-base leading-relaxed' : 'text-sm'}`}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">{children}</code>
                                );
                              },
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ))}

                      {loading && (
                        <p className={`mt-1 text-gray-400 ${isFullscreen ? 'text-base' : 'text-xs'}`}>
                          AI 生成中...
                        </p>
                      )}
                    </div>

                    {/* 输入区域 - 修复位置 */}
                    <div className={`flex gap-2 mt-2 ${isFullscreen ? 'pb-safe-bottom' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !loading && handleAIGCSubmit()}
                          placeholder="输入你的问题..."
                          className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:text-gray-100
                                    min-w-0 text-sm sm:text-base
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                    transition-all duration-200"
                          disabled={loading}
                        />
                      </div>
 
                      <div className="flex-shrink-0">
                        <Button
                          type="button"
                          onClick={handleAIGCSubmit}
                          variant="primary"
                          size="sm"
                          disabled={loading || !input.trim()}
                          loading={loading}
                          className="whitespace-nowrap px-3 py-2 text-sm"
                        >
                          发送
                        </Button>
                      </div>
                    </div>

                    {/* 移动端提示 */}
                    {!isFullscreen && (
                      <div className="block sm:hidden text-xs text-gray-500 dark:text-gray-400 text-center">
                        💡 建议点击"全屏"获得更好的对话体验
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {task.allowAIGC && !task.requireAIGCLog && aigcLog.length > 0 && (
                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={shouldUploadAIGC}
                      onChange={(e) => setShouldUploadAIGC(e.target.checked)}
                      className="rounded"
                    />
                    同时上传我的AIGC对话记录（可选）
                  </label>
                </div>
              )}

              <Button
                type="submit"
                variant={taskStatus?.isLate ? "warning" : "primary"}
                fullWidth
                disabled={loading}
              >
                {taskStatus?.isLate ? '⚠️ 逾期提交作业' : '📤 提交作业'}
              </Button>

              {message && (
                <p
                  className={`mt-2 text-sm px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-300 ${
                    message.startsWith('✅')
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : message.startsWith('⚠️')
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      : message.startsWith('📤')
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
                >
                  {message}
                </p>
              )}
            </form>
          ) : (
            <div className="text-center py-10">
              <p className="text-red-600 dark:text-red-400 text-lg font-medium mb-4">
                ❌ 任务已截止，无法提交作业
              </p>
              <Button
                variant="secondary"
                onClick={() => navigate('/student')}
              >
                返回学生首页
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitTask;