// src/components/MobileNavbar.jsx - 修复按钮遮挡问题
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressiveLogo from './ProgressiveLogo';

const MobileNavbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 关闭菜单当路由改变时
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  if (!user) return null;

  const isTeacher = user.role === 'teacher';
  const dashboardPath = isTeacher ? '/teacher' : '/student';

  const menuItems = isTeacher ? [
    { label: '教师首页', path: '/teacher', icon: '🏠' },
    { label: '我的班级', path: '/my-classes', icon: '📚' },
    { label: '创建班级', path: '/create-class', icon: '➕' },
  ] : [
    { label: '学生首页', path: '/student', icon: '🏠' },
    { label: '加入班级', path: '/join-class', icon: '➕' },
  ];

  return (
    <>
      {/* 主导航栏 - 提高z-index */}
      <motion.div
        className={`
          fixed top-0 left-0 right-0 z-[100]
          backdrop-blur-md border-b transition-all duration-300
          ${scrolled 
            ? 'bg-white/90 dark:bg-gray-900/90 border-gray-200/50 dark:border-gray-800/50' 
            : 'bg-white/70 dark:bg-gray-900/70 border-transparent'
          }
        `}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo和标题 */}
          <motion.div
            className="flex items-center cursor-pointer"
            onClick={() => navigate(dashboardPath)}
            whileTap={{ scale: 0.95 }}
          >
            <ProgressiveLogo
              size="medium"
              className="mr-2 rounded-lg"
              priority={true}
            />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              PoTAcademy
            </span>
          </motion.div>

          {/* 用户信息和菜单按钮 */}
          <div className="flex items-center gap-3">
            {/* 用户角色标识 */}
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
              {isTeacher ? '教师' : '学生'}
            </span>

            {/* 菜单按钮 */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? '✕' : '☰'}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 下拉菜单 - 提高z-index */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-[90]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* 菜单内容 */}
            <motion.div
              className="fixed top-[73px] left-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-[95] overflow-hidden"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* 用户信息区域 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                  {user.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isTeacher ? '教师账户' : '学生账户'}
                </p>
              </div>

              {/* 菜单项 */}
              <div className="py-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {item.label}
                    </span>
                  </motion.button>
                ))}

                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: menuItems.length * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-lg">🚪</span>
                    <span className="font-medium">退出登录</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 页面内容的顶部占位 - 调整高度 */}
      <div className="h-[65px]" />
    </>
  );
};

export default MobileNavbar;