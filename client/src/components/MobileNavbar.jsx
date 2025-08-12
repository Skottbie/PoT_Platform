// src/components/MobileNavbar.jsx - 保留原版设计，只更新下拉菜单
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
    { label: '教师首页', path: '/teacher', icon: '🏠', color: 'blue' },
    { label: '我的班级', path: '/my-classes', icon: '📚', color: 'green' },
    { label: '创建班级', path: '/create-class', icon: '➕', color: 'purple' },
  ] : [
    { label: '学生首页', path: '/student', icon: '🏠', color: 'blue' },
    { label: '加入班级', path: '/join-class', icon: '➕', color: 'green' },
  ];

  return (
    <>
      {/* 主导航栏 - 保持原版设计 */}
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

      {/* 下拉菜单 - 更新设计 */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* 菜单内容 - 高级设计 */}
            <motion.div
              className="fixed top-[73px] left-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[95] overflow-hidden"
              style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              }}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* 用户信息区域 - Apple风格 */}
              <div className="p-6 border-b border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-sm">
                    <span className="text-xl">
                      {isTeacher ? '👨‍🏫' : '👨‍🎓'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isTeacher ? '教师账户' : '学生账户'}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm" />
                </div>
              </div>

              {/* 菜单项 - Apple风格简洁设计 */}
              <div className="py-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-200 active:bg-gray-100/80 dark:active:bg-gray-700/50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {item.label}
                    </span>
                  </motion.button>
                ))}

                <div className="border-t border-gray-200/50 dark:border-gray-700/50 mt-2 pt-2">
                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-all duration-200 text-red-600 dark:text-red-400 active:bg-red-100/80 dark:active:bg-red-900/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: menuItems.length * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                      <span className="text-lg">🚪</span>
                    </div>
                    <span className="font-medium">退出登录</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 页面内容的顶部占位 */}
      <div className="h-[65px]" />
    </>
  );
};

export default MobileNavbar;