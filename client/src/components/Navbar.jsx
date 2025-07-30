// src/components/Navbar.jsx
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import logo from '../assets/logo.png'; // 路径根据你的项目调整

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      //await api.post('/auth/logout'); // 如果你没有 logout 接口，这行可以删掉
      localStorage.removeItem('token'); // 删除 JWT
      navigate('/'); // 返回登录页
    } catch (err) {
      console.error('登出失败', err);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white shadow py-3 px-6 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => {
        if (user.role === 'teacher') navigate('/teacher');
        else navigate('/student');
      }}>
        <div className="flex flex-row items-center">
        <img src={logo} alt="PoTAcademy Logo" className="h-8 w-8 mr-2" />
        <span className="text-xl font-bold text-blue-600 select-none">PoTAcademy</span>
        </div>

      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-600 text-sm">👋 {user.email}</span>
        <span className="text-gray-500 text-xs">（{user.role === 'teacher' ? '教师' : '学生'}）</span>

        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:underline"
        >
          登出
        </button>
      </div>
    </div>
  );
};

export default Navbar;
