// src/pages/SubmitTask.jsx

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ReactMarkdown from 'react-markdown';
//import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
//import { duotoneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs'; 
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);

const SubmitTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [model, setModel] = useState('qwen');
  
  const [aigcLog, setAigcLog] = useState([]);
  const [input, setInput] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shouldUploadAIGC, setShouldUploadAIGC] = useState(false);

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

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await api.get(`/task/${taskId}`);
        setTask(res.data);

        const check = await api.get(`/submission/check/${taskId}`);
        setAlreadySubmitted(check.data.submitted);
      } catch {
        navigate('/student');
      }
    };
    fetchTask();
  }, [taskId, navigate]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [aigcLog, loading]);

  // 📌 新增：检查任务状态
  const getTaskStatus = () => {
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
  };

  // 📌 新增：格式化截止时间
  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAIGCSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setAigcLog((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/aigc/chat', {
        messages: [...aigcLog, userMessage],
        model,
      });
      const aiMessage = { role: 'assistant', content: res.data.reply };
      setAigcLog((prev) => [...prev, aiMessage]);
    } catch {
      setAigcLog((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ AI 回复失败' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const taskStatus = getTaskStatus();
    
    // 📌 新增：检查是否可以提交
    if (!taskStatus.canSubmit) {
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

      /*
      if (task.requireAIGCLog && aigcLog.length > 0) {
        const logBlob = new Blob([JSON.stringify(aigcLog)], {
          type: 'application/json',
        });
        formData.append('aigcLog', logBlob, 'aigcLog.json');
      }

      if ((task.requireAIGCLog || shouldUploadAIGC) && aigcLog.length > 0) {
        const logBlob = new Blob([JSON.stringify(aigcLog)], {
          type: 'application/json',
        });
        formData.append('aigcLog', logBlob, 'aigcLog.json');
      }
        */
      if (task.requireAIGCLog && aigcLog.length > 0) {
        const logBlob = new Blob([JSON.stringify(aigcLog)], {
          type: 'application/json',
        });
        formData.append('aigcLog', logBlob, 'aigcLog.json');
      } else if (shouldUploadAIGC && aigcLog.length > 0) {
        // 只有在不是必需的情况下，但用户选择上传时才添加
        const logBlob = new Blob([JSON.stringify(aigcLog)], {
          type: 'application/json',
        });
        formData.append('aigcLog', logBlob, 'aigcLog.json');
      }

      
      // 📌 新增：传递逾期信息
      if (taskStatus.isLate) {
        formData.append('isLateSubmission', 'true');
        formData.append('lateMinutes', taskStatus.lateMinutes.toString());
      }

      const res = await api.post(`/submission/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('提交成功', res.data);

      if (taskStatus.isLate) {
        setMessage('⚠️ 逾期提交成功！该作业将被标注为逾期提交。');
      } else {
        setMessage('✅ 提交成功！');
      }
      
      setFile(null);
      setImages([]);
      setContent('');
      setAigcLog([]);

      setTimeout(() => {
        navigate('/student');
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage(`❌ 提交失败：${err.response?.data?.message || err.message}`);
    }
  };

  if (!task)
    return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">加载任务中...</p>;

  if (alreadySubmitted) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          提交任务：{task.title}
        </h1>
        <p className="text-green-600 text-sm">
          ✅ 你已提交此任务，无法重复提交。
        </p>
        <button
          onClick={() => navigate('/student')}
          className="mt-4 text-blue-600 underline"
        >
          ← 返回学生首页
        </button>
      </div>
    );
  }

  const taskStatus = getTaskStatus();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow p-8 relative transition-colors duration-300">

        {/* 返回仪表盘按钮 */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-4"
          onClick={() => navigate('/student')}
        >
          👈 返回仪表盘
        </Button>

        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          提交任务：{task.title}
        </h1>

        {/* 📌 新增：任务状态提醒 */}
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
          <p>⏰ 截止时间：{formatDeadline(task.deadline)}</p>
          <p>📝 作业文件：{task.needsFile ? '必交' : '可选'}</p>
          <p>🤖 AIGC 使用：{task.allowAIGC ? '允许' : '禁止'}</p>
          {task.allowAIGC && (
            <p>📝 AIGC 日志：{task.requireAIGCLog ? '必交' : '可选'}</p>
          )}
          <p>📋 逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}</p>
        </div>

        {/* 📌 修改：只有在可以提交时才显示表单 */}
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
                      ? 'fixed inset-0 w-full h-full z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 flex flex-col md:items-center md:justify-center md:px-0'
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
                  </div>

                  {isFullscreen && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute top-4 right-4"
                      onClick={() => setIsFullscreen(false)}
                    >
                      退出全屏
                    </Button>
                  )}

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
                        ? `flex-1 pb-24 text-lg leading-relaxed px-2 sm:px-4 space-y-3 
                        md:max-w-3xl md:w-full md:mx-auto`
                        : 'h-40 sm:h-52 md:h-64 text-sm leading-snug'
                      }
                    `}
                  >
                    {aigcLog.map((msg, idx) => (
                      <div key={idx}>
                        <strong
                          className={`${msg.role === 'user' ? 'text-blue-600' : 'text-green-600'}
                            ${isFullscreen ? 'text-xl block mb-1' : 'text-base'}
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
                                  style={duotoneLight}
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

                  {/* 输入区 */}
                  <div
                    className={`flex gap-2 mt-2 ${
                      isFullscreen
                        ? 'md:max-w-3xl md:mx-auto w-full pb-10'
                        : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="输入你的问题..."
                      className="flex-1 border rounded-lg p-2 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <Button type="button" onClick={handleAIGCSubmit} variant="primary">
                      发送
                    </Button>
                  </div>
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
  );
};

export default SubmitTask;