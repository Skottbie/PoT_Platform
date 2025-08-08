// src/components/Navbar.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProgressiveLogo from './ProgressiveLogo';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!user) return null;

  return (
    <div
      className={`
        sticky top-0 z-50
        backdrop-blur-md 
        shadow-sm border-b border-gray-200 dark:border-gray-800
        px-4 py-3 sm:px-6 sm:py-3
        flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2
        transition-all duration-300
        ${scrolled 
          ? 'bg-white/50 dark:bg-gray-900/50' 
          : 'bg-white/70 dark:bg-gray-900/70'}
      `}
    >
      {/* Logo + Title */}
      <div
        className="flex items-center cursor-pointer group"
        onClick={() => navigate(user.role === 'teacher' ? '/teacher' : '/student')}
      >
        <ProgressiveLogo
          size="medium"
          className="mr-2 rounded-lg shadow-sm transform transition-transform duration-300 group-hover:scale-110"
          priority={true} // 导航栏logo优先加载
        />
        <span
          className="text-xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
                     bg-clip-text text-transparent animate-gradient-slide"
        >
          PoTAcademy
        </span>
      </div>

      {/* User Info */}
      <div
        className="
          flex w-full sm:w-auto 
          justify-between sm:justify-start 
          items-center text-xs sm:text-sm
        "
      >
        {/* 左侧：邮箱 + 角色 */}
        <div className="flex items-center gap-2 truncate group relative">
          <span
            className="truncate max-w-[120px] sm:max-w-[200px] lg:max-w-[300px] 
                       text-gray-700 dark:text-gray-200"
            title={user.email} // tooltip
          >
            {user.email}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium 
                       bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300
                       animate-pulse-slow"
          >
            {user.role === 'teacher' ? '教师' : '学生'}
          </span>
        </div>

        {/* 右侧：登出按钮 */}
        <button
          onClick={handleLogout}
          className="
            px-3 py-1 rounded-lg text-xs sm:text-sm 
            bg-red-500 text-white hover:bg-red-600 
            shadow-sm active:scale-95 ml-2 sm:ml-3
            transition-all duration-200 hover:shadow-md
          "
        >
          登出
        </button>
      </div>
    </div>
  );
};

export default Navbar;