// client/src/pages/OnboardingEntrance.jsx - Step 1: 引导入口页面 (修复版本)
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const OnboardingEntrance = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [typingState, setTypingState] = useState({
    desktopEn: '', // Join the Future of Thinking.
    desktopZh: '', // 思考，未曾如此。
    mobileFirst: '', // 思考，
    mobileSecond: '', // 未曾如此。
    showCursor: true,
    currentPosition: 'first', // 'first', 'second', 'none'
    isComplete: false,
    showButtons: false
  });

  // 响应式检测 - 优化iOS检测
  useEffect(() => {
    const checkIsMobile = () => {
      const width = window.innerWidth;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsMobile(width < 768 || isIOS);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 文字内容配置
  const texts = {
    desktop: {
      en: 'Join the Future of Thinking.',
      zh: '思考，未曾如此。'
    },
    mobile: {
      first: '思考，',
      second: '未曾如此。'
    }
  };

  // 打字动画效果
  useEffect(() => {
    let timeouts = [];
    let blinkInterval;

    const typeText = async () => {
      // 动画完成后的统一处理逻辑
      const handleTypingComplete = () => {
        setTypingState(prev => ({ 
          ...prev, 
          isComplete: true, 
          currentPosition: 'none'
        }));
        
        let blinkCount = 0;
        blinkInterval = setInterval(() => {
          setTypingState(prev => ({ ...prev, showCursor: !prev.showCursor }));
          blinkCount++;
          if (blinkCount >= 5) { // 闪烁2.5次
            clearInterval(blinkInterval);
            setTypingState(prev => ({ ...prev, showCursor: false }));

            // 🎯 优化：闪烁结束后立即开始丝滑的上移+按钮出现动画
            setTimeout(() => {
              setTypingState(prev => ({ ...prev, showButtons: true }));
            }, 200); 
          }
        }, 400); // 稍慢的闪烁节奏
      };

      if (isMobile) {
        // 移动端：先打第一列，再打第二列
        setTypingState(prev => ({ ...prev, currentPosition: 'first' }));
        
        for (let i = 0; i <= texts.mobile.first.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              mobileFirst: texts.mobile.first.slice(0, i)
            }));
          }, i * 120));
        }

        // 第一列完成后切换到第二列
        const firstColDelay = texts.mobile.first.length * 120 + 300;
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({ ...prev, currentPosition: 'second' }));
        }, firstColDelay));
        
        for (let i = 0; i <= texts.mobile.second.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              mobileSecond: texts.mobile.second.slice(0, i)
            }));
          }, firstColDelay + i * 120));
        }

        const totalDelay = firstColDelay + texts.mobile.second.length * 120;
        timeouts.push(setTimeout(handleTypingComplete, totalDelay));

      } else {
        // 桌面端：先打英文，再打中文
        setTypingState(prev => ({ ...prev, currentPosition: 'first' }));
        
        for (let i = 0; i <= texts.desktop.en.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              desktopEn: texts.desktop.en.slice(0, i)
            }));
          }, i * 100));
        }

        const enLineDelay = texts.desktop.en.length * 100 + 400;
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({ ...prev, currentPosition: 'second' }));
        }, enLineDelay));
        
        for (let i = 0; i <= texts.desktop.zh.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              desktopZh: texts.desktop.zh.slice(0, i)
            }));
          }, enLineDelay + i * 150));
        }

        const totalDelay = enLineDelay + texts.desktop.zh.length * 150;
        timeouts.push(setTimeout(handleTypingComplete, totalDelay));
      }
    };

    typeText();

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (blinkInterval) {
        clearInterval(blinkInterval);
      }
    };
  }, [isMobile]);

  // 按钮点击处理
  const handleExplore = useCallback(() => {
    navigate('/onboarding/identity', { 
      state: { from: 'entrance' },
      replace: false 
    });
  }, [navigate]);

  const handleLogin = useCallback(() => {
    navigate('/login', { 
      state: { from: 'entrance' },
      replace: false 
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <motion.div 
        className="text-center max-w-4xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* 主标语区域 - 🎯 优化丝滑上移动画 */}
        <motion.div 
          className="mb-16"
          animate={typingState.showButtons ? 
            { y: -30, scale: 0.95 } : 
            { y: 0, scale: 1 }
          }
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad - 更丝滑的缓动
            type: "tween"
          }}
        >
          {isMobile ? (
            // 🎯 修复iOS兼容性 - 使用flex布局代替CSS writing-mode
            <div className="flex flex-col items-center space-y-8 min-h-[300px] justify-center">
              {/* 第一行：思考， */}
              <div className="relative flex items-center justify-center">
                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white tracking-wide">
                  {typingState.mobileFirst}
                  {/* 光标只在当前打字位置显示 */}
                  {typingState.currentPosition === 'first' && typingState.showCursor && (
                    <motion.span
                      className="inline-block w-1 h-12 sm:h-16 bg-gray-900 dark:bg-white ml-2 align-bottom"
                      animate={{ opacity: [1, 0] }}
                      transition={{ 
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </h1>
              </div>
              
              {/* 第二行：未曾如此。 */}
              <div className="relative flex items-center justify-center">
                <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white tracking-wide">
                  {typingState.mobileSecond}
                  {/* 光标只在当前打字位置显示 */}
                  {typingState.currentPosition === 'second' && typingState.showCursor && (
                    <motion.span
                      className="inline-block w-1 h-12 sm:h-16 bg-gray-900 dark:bg-white ml-2 align-bottom"
                      animate={{ opacity: [1, 0] }}
                      transition={{ 
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </h2>
              </div>
            </div>
          ) : (
            // 桌面端：横向布局
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="relative">
                <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {typingState.desktopEn}
                  {typingState.currentPosition === 'first' && typingState.showCursor && (
                    <motion.span
                      className="inline-block w-1 h-12 xl:h-14 bg-gray-900 dark:bg-white ml-1 align-bottom"
                      animate={{ opacity: [1, 0] }}
                      transition={{ 
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </h1>
              </div>
              <div className="relative">
                <h2 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {typingState.desktopZh}
                  {typingState.currentPosition === 'second' && typingState.showCursor && (
                    <motion.span
                      className="inline-block w-1 h-12 xl:h-14 bg-gray-900 dark:bg-white ml-1 align-bottom"
                      animate={{ opacity: [1, 0] }}
                      transition={{ 
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </h2>
              </div>
            </div>
          )}
        </motion.div>

        {/* 操作按钮 - 🎯 优化出现动画 */}
        <AnimatePresence>
          {typingState.showButtons && (
            <motion.div
              className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center sm:items-center"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.3 // 在标语上移动画开始后稍微延迟
              }}
            >
              {/* 探索 PoT Academy 按钮 */}
              <motion.button
                onClick={handleExplore}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl
                         shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-300 ease-out
                         focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">探索PoT Academy</span>
              </motion.button>

              {/* 已有账号按钮 */}
              <motion.button
                onClick={handleLogin}
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl
                         hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-300 ease-out
                         focus:outline-none focus:ring-4 focus:ring-gray-500/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: "rgba(0, 0, 0, 0.02)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">我已经是PoT的一员</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 品牌标识 */}
        <motion.div 
          className="mt-16 text-gray-400 dark:text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: typingState.showButtons ? 1 : 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <p className="text-sm">Proof of Thought Academy</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OnboardingEntrance;