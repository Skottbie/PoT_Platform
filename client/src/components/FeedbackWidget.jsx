// src/components/FeedbackWidget.jsx

import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import logo from '../assets/logo.png';

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [hintTimer, setHintTimer] = useState(null);

  const toggleOpen = () => {
    setOpen(!open);
    setHintVisible(false); // 用户点击后提示消失
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
    } catch (error) {
      setMessage('❌ 提交失败，请稍后再试');
    } finally {
      setSending(false);
    }
  };

  /** 模拟用户遇到问题时提示 **/
  useEffect(() => {
    let clickCount = 0;
    const handleClick = () => {
      clickCount++;
      if (clickCount >= 5 && !open) {
        setHintVisible(true);
        clickCount = 0;

        // 3 秒后自动隐藏
        if (hintTimer) clearTimeout(hintTimer);
        const timer = setTimeout(() => setHintVisible(false), 3000);
        setHintTimer(timer);
      }
    };

    const idleTimer = setTimeout(() => {
      if (!open) {
        setHintVisible(true);
        // 3 秒后自动隐藏
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
      {/* 悬浮按钮 */}
      <div className="fixed bottom-6 right-6 z-50 relative">
        {hintVisible && (
          <div
            className="absolute -top-10 -left-2 bg-white dark:bg-gray-800 shadow-lg 
                      border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-xl 
                      text-sm text-gray-700 dark:text-gray-200 animate-bounce
                      transition-opacity duration-500 opacity-100"
          >
            有任何问题可以点击我反馈哦(`v´)
            <div className="absolute bottom-0 left-6 translate-y-full w-0 h-0 
                            border-l-4 border-r-4 border-t-8 
                            border-l-transparent border-r-transparent 
                            border-t-white dark:border-t-gray-800"></div>
          </div>
        )}

        <button
          onClick={toggleOpen}
          className="relative w-14 h-14 rounded-full shadow-lg bg-white flex items-center justify-center 
                    cursor-pointer hover:scale-110 transition-transform"
          title="点击反馈"
        >
          <img src={logo} alt="Feedback" className="w-10 h-10" />
        </button>
      </div>


      {/* 弹出反馈表单 */}
      <div
        className={`fixed bottom-28 right-6 z-50 w-80 
          transform transition-all duration-300 origin-bottom-right
          ${open ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              rows="4"
              placeholder="请输入你的反馈..."
              className="w-full border rounded-md p-2 resize-none bg-white dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={sending}
              required
            />
            <div className="flex justify-between items-center">
              <button
                type="submit"
                disabled={sending}
                className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
              >
                {sending ? '提交中...' : '提交反馈'}
              </button>
              <button
                type="button"
                onClick={toggleOpen}
                className="text-gray-500 dark:text-gray-400 hover:underline text-sm"
              >
                关闭
              </button>
            </div>
            {message && (
              <p
                className={`text-sm mt-2 ${
                  message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
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

