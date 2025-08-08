// src/components/FeedbackWidget.jsx

import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import Button from './Button';
import ProgressiveLogo from './ProgressiveLogo';

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [hintTimer, setHintTimer] = useState(null);

  const toggleOpen = () => {
    setOpen(!open);
    setHintVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return setMessage('反馈内容不能为空');

    setSending(true);
    setMessage('');
    try {
      await api.post('/feedback', { content: feedback });
      setMessage('✅ 感谢你的反馈！');
      setFeedback('');
    } catch {
      setMessage('❌ 提交失败，请稍后再试');
    } finally {
      setSending(false);
    }
  };

  /** 用户行为提示逻辑 */
  useEffect(() => {
    let clickCount = 0;
    const handleClick = () => {
      clickCount++;
      if (clickCount >= 5 && !open) {
        setHintVisible(true);
        clickCount = 0;
        if (hintTimer) clearTimeout(hintTimer);
        const timer = setTimeout(() => setHintVisible(false), 3000);
        setHintTimer(timer);
      }
    };

    const idleTimer = setTimeout(() => {
      if (!open) {
        setHintVisible(true);
        if (hintTimer) clearTimeout(hintTimer);
        const timer = setTimeout(() => setHintVisible(false), 3000);
        setHintTimer(timer);
      }
    }, 20000);

    window.addEventListener('click', handleClick);

    return () => {
      clearTimeout(idleTimer);
      if (hintTimer) clearTimeout(hintTimer);
      window.removeEventListener('click', handleClick);
    };
  }, [open]);

  return (
    <>
      {/* 悬浮按钮及提示气泡 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {hintVisible && (
          <div
            className="relative mb-1 mr-8 text-sm text-gray-700 dark:text-gray-200
                       animate-bounce select-none
                       bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700
                       border border-gray-200 dark:border-gray-700
                       px-3 py-1 rounded-xl shadow-lg backdrop-blur-md"
          >
            有任何问题可以点击我反馈哦 (`v´)
            <div
              className="absolute -bottom-2 right-2 w-0 h-0
                          border-l-6 border-l-transparent
                          border-r-6 border-r-transparent
                          border-t-8 border-t-white dark:border-t-gray-800"
            />
          </div>
        )}

        {/* 悬浮按钮 */}
        <button
          onClick={toggleOpen}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                      bg-white dark:bg-gray-900
                      hover:scale-110 active:scale-95 transition-transform backdrop-blur-md
                      overflow-hidden`}
          title="点击反馈"
        >
          <ProgressiveLogo
            size="medium"
            priority={false} // 反馈按钮可以稍后加载高质量版本
            className="transform transition-transform duration-200"
          />
        </button>
      </div>

      {/* 弹出反馈表单 */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 
          transform transition-all duration-300 origin-bottom-right
          ${open ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <div className="bg-white/80 dark:bg-gray-900/80 p-4 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl transition-all duration-300">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              rows="4"
              placeholder="请输入你的反馈..."
              className="w-full border rounded-lg p-2 resize-none
                         bg-white/60 dark:bg-gray-800/60 
                         text-gray-800 dark:text-gray-200
                         border-gray-300/50 dark:border-gray-600/50
                         focus:ring-2 focus:ring-blue-400 focus:outline-none
                         backdrop-blur-sm"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={sending}
              required
            />

            <div className="flex justify-between items-center mt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={sending}
              >
                {sending ? '提交中...' : '提交反馈'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleOpen}
              >
                关闭
              </Button>
            </div>

            {message && (
              <p
                className={`mt-2 text-sm px-3 py-1 rounded-lg backdrop-blur-sm transition-all duration-300 ${
                  message.startsWith('✅')
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}