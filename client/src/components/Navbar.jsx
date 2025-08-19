// client/src/components/Navbar.jsx - 修复桌面端导航栏

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProgressiveLogo from './ProgressiveLogo';
import UserProfileModal from './UserProfileModal';

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

        {/* 用户信息区域 - 只显示昵称+邮箱 */}
        <div className="flex w-full sm:w-auto justify-between sm:justify-start items-center text-xs sm:text-sm">
          <div className="flex items-center gap-3 truncate group relative user-menu-container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              {/* 显示昵称或邮箱前缀 */}
              <span className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[200px] lg:max-w-[300px]">
                {user.nickname || user.email.split('@')[0]}
              </span>
              
              {/* 邮箱（小字显示） */}
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                {user.email}
              </span>
              
              {/* 用户角色标识 */}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {user.role === 'teacher' ? '教师' : '学生'}
              </span>
            </div>
            
            {/* 🔧 修复用户菜单按钮 - 改为齿轮图标 */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Settings button clicked!'); // 调试日志
                  setShowUserMenu(!showUserMenu);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                title="用户设置"
              >
                {/* 🆕 齿轮图标 */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* 用户下拉菜单 */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Profile menu clicked!'); // 调试日志
                      handleOpenProfile();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    个人设置
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 用户设置弹窗 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          console.log('Closing profile modal'); // 调试日志
          setShowProfileModal(false);
        }}
        user={user}
        onUserUpdate={onUserUpdate}
      />
    </>
  );
};

export default Navbar;