import { useState } from 'react';
import api from '../api/axiosInstance';
import logo from '../assets/logo.png';

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const toggleOpen = () => setOpen(!open);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return setMessage('反馈内容不能为空');

    setSending(true);
    setMessage('');
    try {
      await api.post('/feedback', { content: feedback }); // 你后台要有这个接口
      setMessage('✅ 感谢你的反馈！');
      setFeedback('');
    } catch (error) {
      setMessage('❌ 提交失败，请稍后再试');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg bg-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
        title="点击反馈"
      >
        <img src={logo} alt="Feedback" className="w-10 h-10" />
      </button>

      {/* 弹出反馈表单 */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white p-4 rounded-xl shadow-lg border border-gray-300">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              rows="4"
              placeholder="请输入你的反馈..."
              className="w-full border rounded-md p-2 resize-none"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={sending}
              required
            />
            <div className="flex justify-between items-center">
              <button
                type="submit"
                disabled={sending}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? '提交中...' : '提交反馈'}
              </button>
              <button
                type="button"
                onClick={toggleOpen}
                className="text-gray-500 hover:underline"
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
      )}
    </>
  );
}
