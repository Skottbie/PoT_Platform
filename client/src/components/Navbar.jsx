// client/src/components/Navbar.jsx - 完整的桌面端导航栏（添加用户设置功能）

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProgressiveLogo from './ProgressiveLogo';
import UserProfileModal from './UserProfileModal';
import { getGreeting } from '../utils/greetings';

const Navbar = ({ user, onUserUpdate }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleOpenProfile = () => {
    setShowUserMenu(false);
    setShowProfileModal(true);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  if (!user) return null;

  return (
    <>
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
            priority={true}
          />
          <span
            className="text-xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
                       bg-clip-text text-transparent animate-gradient-slide"
          >
            PoTAcademy
          </span>
        </div>

        {/* 🆕 用户信息区域 - 支持智能问候语和设置 */}
        <div className="flex w-full sm:w-auto justify-between sm:justify-start items-center text-xs sm:text-sm">
          {/* 🆕 智能问候语显示 */}
          <div className="flex items-center gap-3 truncate group relative user-menu-container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              {/* 智能问候语 */}
              <span className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[200px] lg:max-w-[300px]">
                {getGreeting(user.role, user.nickname, user.email)}
              </span>
              
              {/* 用户角色标识 */}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {user.role === 'teacher' ? '教师' : '学生'}
              </span>
            </div>
            
            {/* 🆕 用户菜单按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                title="用户设置"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
              
              {/* 🆕 用户下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {/* 用户信息头部 */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.nickname || user.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  
                  {/* 菜单项 */}
                  <button
                    onClick={handleOpenProfile}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-base">⚙️</span>
                    个人设置
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <span className="text-base">🚪</span>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🆕 用户设置弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUserUpdate={onUserUpdate}
      />
    </>
  );
};

export default Navbar;