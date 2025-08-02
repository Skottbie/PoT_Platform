// src/components/Navbar.jsx

import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="
      sticky top-0 z-50
      backdrop-blur-md bg-white/70 dark:bg-gray-900/70 
      shadow-sm border-b border-gray-200 dark:border-gray-800
      px-4 py-3 sm:px-6 sm:py-3
      flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2
    ">
      {/* Logo + Title */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => navigate(user.role === 'teacher' ? '/teacher' : '/student')}
      >
        <img src={logo} alt="PoTAcademy Logo" className="h-8 w-8 mr-2 rounded-lg shadow-sm" />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          PoTAcademy
        </span>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 text-sm">
        <span className="truncate max-w-[120px] sm:max-w-[200px] lg:max-w-[300px] text-gray-700 dark:text-gray-200">
          {user.email}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium 
          bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {user.role === 'teacher' ? '教师' : '学生'}
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded-lg text-sm 
            bg-red-500 text-white hover:bg-red-600 transition
            shadow-sm active:scale-95"
        >
          登出
        </button>
      </div>
    </div>
  );
};

export default Navbar;
