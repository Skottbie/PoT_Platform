// client/src/components/MobileNavbar.jsx - 全面优化版本
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Plus, 
  Settings, 
  LogOut, 
  User,
  GraduationCap
} from 'lucide-react';
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

  const handleOpenProfile = () => {
    setIsMenuOpen(false);
    navigate('/user-profile');
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
    { 
      label: '教师首页', 
      path: '/teacher', 
      icon: Home, 
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      label: '我的班级', 
      path: '/my-classes', 
      icon: BookOpen, 
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      textColor: 'text-green-600 dark:text-green-400'
    },
    { 
      label: '创建班级', 
      path: '/create-class', 
      icon: Plus, 
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/50',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
  ] : [
    { 
      label: '学生首页', 
      path: '/student', 
      icon: Home, 
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      label: '加入班级', 
      path: '/join-class', 
      icon: GraduationCap, 
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      textColor: 'text-green-600 dark:text-green-400'
    },
  ];

  // 高级动画配置
  const springTransition = {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 0.8
  };

  const staggerTransition = {
    staggerChildren: 0.08,
    delayChildren: 0.1
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: springTransition
    },
    hover: {
      x: 4,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.96,
      x: 2
    }
  };

  return (
    <>
      {/* 主导航栏 */}
      <motion.div
        className={`
          fixed top-0 left-0 right-0 z-[100]
          backdrop-blur-xl border-b transition-all duration-500 ease-out
          ${scrolled 
            ? 'bg-white/92 dark:bg-gray-900/92 border-gray-200/60 dark:border-gray-800/60 shadow-lg shadow-black/5' 
            : 'bg-white/80 dark:bg-gray-900/80 border-transparent'
          }
        `}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={springTransition}
      >
        <div className="flex items-center justify-between px-4 py-3 relative">
          {/* Logo和标题 */}
          <motion.div
            className="flex items-center cursor-pointer"
            onClick={() => navigate(dashboardPath)}
            whileTap={{ scale: 0.96 }}
            transition={springTransition}
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
            {/* 显示昵称或邮箱前缀 */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate max-w-[120px]">
                {user.nickname || user.email.split('@')[0]}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isTeacher ? '教师' : '学生'}
              </span>
            </div>

            {/* 菜单按钮 - 高级动画 */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-2.5 text-gray-600 dark:text-gray-400 
                         hover:text-gray-800 dark:hover:text-gray-200
                         transition-all duration-300 ease-out aigc-native-button"
              whileHover={{ 
                scale: 1.12,
                y: -1
              }}
              whileTap={{ scale: 0.88 }}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: scrolled ? 1 : 0.7 }}
              transition={springTransition}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <X size={18} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <Menu size={18} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[90]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* 菜单内容 */}
            <motion.div
              className="fixed top-[73px] left-4 right-4 bg-white/96 dark:bg-gray-900/96 
                         backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 
                         border border-gray-200/60 dark:border-gray-700/60 z-[95] overflow-hidden"
              style={{
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              }}
              initial={{ opacity: 0, y: -30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.92 }}
              transition={springTransition}
            >
              {/* 用户信息区域 */}
              <div className="p-6 border-b border-gray-200/40 dark:border-gray-700/40 
                            bg-gradient-to-r from-gray-50/60 to-gray-100/40 dark:from-gray-800/40 dark:to-gray-900/40">
                <div className="flex items-center gap-4">
                  {/* 用户头像 */}
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 
                             flex items-center justify-center shadow-lg shadow-blue-500/25"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User size={24} className="text-white" strokeWidth={2} />
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-base">
                      {user.nickname || user.email.split('@')[0]}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* 快捷设置按钮 */}
                  <motion.button
                    onClick={handleOpenProfile}
                    className="w-10 h-10 rounded-xl bg-gray-200/80 dark:bg-gray-700/80 
                             flex items-center justify-center text-gray-600 dark:text-gray-400 
                             hover:bg-gray-300/80 dark:hover:bg-gray-600/80 transition-colors"
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Settings size={18} strokeWidth={2} />
                  </motion.button>
                </div>
              </div>

              {/* 菜单项 */}
              <motion.div 
                className="py-3"
                variants={staggerTransition}
                initial="hidden"
                animate="visible"
              >
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left 
                             hover:bg-gray-50/80 dark:hover:bg-gray-800/50 
                             active:bg-gray-100/80 dark:active:bg-gray-700/50
                             transition-all duration-200"
                    variants={itemVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <motion.div 
                      className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <item.icon size={20} className={item.textColor} strokeWidth={2} />
                    </motion.div>
                    <span className="font-medium text-gray-700 dark:text-gray-200 text-base">
                      {item.label}
                    </span>
                  </motion.button>
                ))}

                {/* 个人设置菜单项 */}
                <motion.button
                  onClick={handleOpenProfile}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left 
                           hover:bg-gray-50/80 dark:hover:bg-gray-800/50 
                           active:bg-gray-100/80 dark:active:bg-gray-700/50
                           transition-all duration-200"
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <motion.div 
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                  >
                    <Settings size={20} className="text-gray-600 dark:text-gray-400" strokeWidth={2} />
                  </motion.div>
                  <span className="font-medium text-gray-700 dark:text-gray-200 text-base">
                    个人设置
                  </span>
                </motion.button>

                {/* 登出按钮 */}
                <div className="border-t border-gray-200/40 dark:border-gray-700/40 mt-3 pt-3">
                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left 
                             hover:bg-red-50/80 dark:hover:bg-red-900/20 
                             active:bg-red-100/80 dark:active:bg-red-900/30
                             transition-all duration-200 text-red-600 dark:text-red-400"
                    variants={itemVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <motion.div 
                      className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                    >
                      <LogOut size={20} className="text-red-600 dark:text-red-400" strokeWidth={2} />
                    </motion.div>
                    <span className="font-medium text-base">退出登录</span>
                  </motion.button>
                </div>
              </motion.div>
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