// src/components/Navbar.jsx
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import logo from '../assets/logo.png';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      navigate('/');
    } catch (err) {
      console.error('登出失败', err);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white shadow py-3 px-4 space-y-2 sm:space-y-0 sm:px-6 sm:py-3">
      {/* 第 1 行：Logo + 标题 */}
      <div className="flex justify-between items-center">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => {
            navigate(user.role === 'teacher' ? '/teacher' : '/student');
          }}
        >
          <img src={logo} alt="PoTAcademy Logo" className="h-8 w-8 mr-2" />
          <span className="text-xl font-semibold text-blue-600 whitespace-nowrap">
            PoTAcademy
          </span>
        </div>
      </div>

      {/* 第 2 行：邮箱 + 身份 + 登出 */}
      <div className="flex flex-wrap justify-between items-center text-sm gap-y-1 sm:gap-x-4">
        <span className="text-gray-600 truncate max-w-[80vw] sm:max-w-[200px] lg:max-w-[300px]">
          👋 {user.email}
        </span>
        <span className="text-gray-500 text-xs">
          （{user.role === 'teacher' ? '教师' : '学生'}）
        </span>
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
