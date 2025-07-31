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
    <div className="bg-white shadow py-2 px-4 flex flex-col sm:flex-row justify-between items-center sm:items-center">
      {/* Logo + Title */}
      <div
        className="flex items-center cursor-pointer mb-2 sm:mb-0"
        onClick={() => {
          navigate(user.role === 'teacher' ? '/teacher' : '/student');
        }}
      >
        <img src={logo} alt="PoTAcademy Logo" className="h-8 w-8 mr-2" />
        <span className="text-lg font-semibold text-blue-600 whitespace-nowrap">PoTAcademy</span>
      </div>

      {/* User Info + Logout */}
      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-sm">
        <span className="text-gray-600 max-w-[150px] truncate text-xs sm:text-sm">
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
