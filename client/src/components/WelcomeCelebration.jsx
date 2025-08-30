// client/src/components/WelcomeCelebration.jsx - 昵称设置成功庆祝组件

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGreeting } from '../utils/greetings';
import { Sparkles, Heart } from 'lucide-react';

const WelcomeCelebration = ({ user, isVisible, onClose }) => {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isVisible && user?.nickname) {
      setShowCelebration(true);
      
      // 5秒后自动关闭
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, user]);

  const handleClose = () => {
    setShowCelebration(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 500);
  };

  if (!showCelebration || !user?.nickname) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99] pointer-events-none overflow-hidden">
        {/* 背景效果 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm"
        />

        {/* 庆祝卡片 */}
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 max-w-sm w-full text-center pointer-events-auto"
          >
            {/* 动画图标 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 15,
                delay: 0.3 
              }}
              className="relative mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-white" fill="currentColor" />
              </div>
              
              {/* 闪烁效果 */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-full mx-auto opacity-30"
              />
            </motion.div>

            {/* 庆祝文字 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                太棒了！
              </h2>
              
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {getGreeting(user.role, user.nickname, user.email)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  昵称设置成功，开始享受你的PoT生活吧！
                </p>
              </div>
            </motion.div>

            {/* 装饰性火花 */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50
                  }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100
                  }}
                  transition={{ 
                    duration: 3,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 3
                  }}
                  className={`absolute w-2 h-2 rounded-full ${
                    i % 3 === 0 ? 'bg-blue-400' : 
                    i % 3 === 1 ? 'bg-purple-400' : 'bg-pink-400'
                  }`}
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`
                  }}
                />
              ))}
            </div>

            {/* 关闭按钮 */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleClose}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl 
                       hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              开始体验
            </motion.button>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default WelcomeCelebration;