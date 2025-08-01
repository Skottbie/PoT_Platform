// src/pages/SubmitTask.jsx

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { duotoneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';

const SubmitTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [model, setModel] = useState('qwen'); // 默认模型

  const [aigcLog, setAigcLog] = useState([]);
  const [input, setInput] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [loading, setLoading] = useState(false); // AI生成中
  const [isFullscreen, setIsFullscreen] = useState(false); // 全屏模式

  const chatBoxRef = useRef(null);

  // 监听全屏状态，隐藏底部反馈
  useEffect(() => {
    localStorage.setItem('hideFeedback', isFullscreen ? '1' : '0');
    const event = new Event('toggleFeedback');
    window.dispatchEvent(event);
  }, [isFullscreen]);

  // 全屏时禁用背景滚动
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!file) return setMessage('❌ 请上传作业文件');

    if (task.requireAIGCLog && aigcLog.length === 0) {
      return setMessage('❌ 本任务要求上传 AIGC 原始记录，请先进行 AIGC 对话');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (task.requireAIGCLog && aigcLog.length > 0) {
        const logBlob = new Blob([JSON.stringify(aigcLog)], {
          type: 'application/json',
        });
        formData.append('aigcLog', logBlob, 'aigcLog.json');
      }

      await api.post(`/submission/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('✅ 提交成功！');
      setFile(null);
      setAigcLog([]);

      setTimeout(() => {
        navigate('/student');
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage('❌ 提交失败，请重试');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow p-8 relative transition-colors duration-300">

        {/* 返回仪表盘按钮（卡片右上角） */}
        <button
          onClick={() => navigate('/student')}
          className="absolute top-2 right-4 px-3 py-1 text-sm rounded-lg
                     bg-gray-200 hover:bg-gray-300 text-gray-700 shadow
                     dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
        >
          👈 返回仪表盘
        </button>

        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          提交任务：{task.title}
        </h1>

        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-6">
          <p>📁 任务类型：{task.category}</p>
          <p>
            ⏰ 截止时间：
            {task.deadline
              ? new Date(task.deadline).toLocaleDateString()
              : '未设置'}
          </p>
          <p>🤖 AIGC 使用：{task.allowAIGC ? '允许' : '禁止'}</p>
          <p>📝 AIGC 日志：{task.requireAIGCLog ? '需要上传原始记录' : '不需要'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
              作业文件（必传）
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
              required
            />
          </div>

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
                  <label className="font-semibold text-gray-700 dark:text-gray-200">💬 AIGC 对话区</label>

                  {!isFullscreen && (
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      className="px-3 py-1 text-xs rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 
                                dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition"
                    >
                      全屏
                    </button>
                  )}
                </div>

                {isFullscreen && (
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 px-3 py-1 text-xs rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 
                              dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition"
                  >
                    退出全屏
                  </button>
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
                  <option value="openai">🌍 ChatGPT (OpenAI)</option>
                  <option value="qwen">🇨🇳 通义千问 (Alibaba)</option>
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
                <button
                  type="button"
                  onClick={handleAIGCSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 whitespace-nowrap transition"
                >
                  发送
                </button>
              </div>
              </motion.div>
            </AnimatePresence>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-xl shadow hover:bg-blue-700 transition-all"
          >
            📤 提交作业
          </button>

          {message && (
            <p
              className={`text-sm mt-2 ${
                message.startsWith('✅') ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default SubmitTask;
