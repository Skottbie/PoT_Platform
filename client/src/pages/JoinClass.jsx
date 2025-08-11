// src/pages/JoinClass.jsx - 修复布局问题
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';

const JoinClass = () => {
  const [formData, setFormData] = useState({
    inviteCode: '',
    studentId: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/class/join', formData);
      if (res.data.success) {
        setSuccessMsg('🎉 加入成功！');
        setTimeout(() => {
          navigate('/student');
        }, 1500);
      } else {
        setError(res.data.message || '加入失败');
      }
    } catch (err) {
      console.error('加入班级失败:', err);
      setError(err.response?.data?.message || '网络错误或服务器异常');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <div className="max-w-md mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/student')}
            className="w-full sm:w-auto"
          >
            👈 返回学生首页
          </Button>
        </div>

        {/* 主卡片 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h1 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-400 mb-6">
            🔑 加入班级
          </h1>

          {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</p>}
          {successMsg && <p className="text-green-600 dark:text-green-400 text-sm mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">{successMsg}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邀请码
              </label>
              <input
                type="text"
                name="inviteCode"
                placeholder="请输入班级邀请码"
                value={formData.inviteCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                          bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200 text-base"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
               学号
             </label>
             <input
               type="text"
               name="studentId"
               placeholder="请输入您的学号"
               value={formData.studentId}
               onChange={handleChange}
               required
               className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                         bg-gray-50/50 dark:bg-gray-700/50
                         text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200 text-base"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
               姓名
             </label>
             <input
               type="text"
               name="name"
               placeholder="请输入您的姓名"
               value={formData.name}
               onChange={handleChange}
               required
               className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600
                         bg-gray-50/50 dark:bg-gray-700/50
                         text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200 text-base"
             />
           </div>

           <Button
             type="submit"
             variant="primary"
             size="lg"
             fullWidth
             loading={loading}
             disabled={loading}
           >
             {loading ? '正在加入...' : '加入班级'}
           </Button>
         </form>
       </div>
     </div>
   </div>
 );
};

export default JoinClass;