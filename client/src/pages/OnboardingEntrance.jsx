// client/src/pages/OnboardingEntrance.jsx - Step 1: 引导入口页面 (已优化)
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
    isComplete: false,
    showButtons: false
  });

  // 响应式检测
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
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
    // 将 blinkInterval 定义在外部，以便在 cleanup 函数中访问
    let blinkInterval; 

    const typeText = async () => {
      // 动画完成后的统一处理逻辑
      const handleTypingComplete = () => {
        setTypingState(prev => ({ ...prev, isComplete: true }));
        
        let blinkCount = 0;
        blinkInterval = setInterval(() => {
          setTypingState(prev => ({ ...prev, showCursor: !prev.showCursor }));
          blinkCount++;
          if (blinkCount >= 6) { // 3次完整闪烁
            clearInterval(blinkInterval);
            setTypingState(prev => ({ ...prev, showCursor: false }));

            // ✨ FIX: 移除 2.5s 的长延迟，在闪烁结束后通过短延迟立即显示按钮
            setTimeout(() => {
              setTypingState(prev => ({ ...prev, showButtons: true }));
            }, 100); 
          }
        }, 300);
      };

      if (isMobile) {
        // 移动端：先打第一列，再打第二列
        for (let i = 0; i <= texts.mobile.first.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              mobileFirst: texts.mobile.first.slice(0, i)
            }));
          }, i * 80));
        }

        const firstColDelay = texts.mobile.first.length * 80 + 200;
        for (let i = 0; i <= texts.mobile.second.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              mobileSecond: texts.mobile.second.slice(0, i)
            }));
          }, firstColDelay + i * 80));
        }

        const totalDelay = firstColDelay + texts.mobile.second.length * 80;
        timeouts.push(setTimeout(handleTypingComplete, totalDelay));

      } else {
        // 桌面端：先打英文，再打中文
        for (let i = 0; i <= texts.desktop.en.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              desktopEn: texts.desktop.en.slice(0, i)
            }));
          }, i * 80));
        }

        const enLineDelay = texts.desktop.en.length * 80 + 300;
        for (let i = 0; i <= texts.desktop.zh.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              desktopZh: texts.desktop.zh.slice(0, i)
            }));
          }, enLineDelay + i * 100));
        }

        const totalDelay = enLineDelay + texts.desktop.zh.length * 100;
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
        {/* 主标语区域 */}
        <motion.div 
          className="mb-16"
          animate={typingState.showButtons ? { y: -20 } : { y: 0 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.4, 0, 0.2, 1] // easeOutCubic
          }}
        >
          {isMobile ? (
            // ✨ REFACTORED: 移动端布局重构，解决 iOS 兼容性和光标对齐问题
            <div className="flex justify-center items-start gap-8 min-h-[200px]">
              {/* 第一列：思考， */}
              <div className="flex flex-col items-center">
                <p 
                  className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white"
                  style={{ 
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                    letterSpacing: '0.2em' // 增加字间距
                  }}
                >
                  {typingState.mobileFirst}
                </p>
                {!typingState.isComplete && typingState.mobileSecond === '' && (
                  <motion.span
                    className="block w-8 h-1 bg-gray-900 dark:bg-white mt-4"
                    layoutId="mobile-cursor"
                    animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ 
                      duration: 0.8,
                      repeat: typingState.isComplete ? 0 : Infinity,
                      repeatType: "reverse"
                    }}
                  />
                )}
              </div>
              
              {/* 第二列：未曾如此。 */}
              <div className="flex flex-col items-center">
                <p
                  className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white"
                  style={{ 
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                    letterSpacing: '0.2em' // 增加字间距
                  }}
                >
                  {typingState.mobileSecond}
                </p>
                {typingState.mobileSecond !== '' && (
                  <motion.span
                    className="block w-8 h-1 bg-gray-900 dark:bg-white mt-4"
                    layoutId="mobile-cursor"
                    animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ 
                      duration: 0.8,
                      repeat: typingState.isComplete ? 0 : Infinity,
                      repeatType: "reverse"
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            // 桌面端布局
            <div className="space-y-6">
              <div className="relative text-center">
                <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight inline-flex items-baseline">
                  {typingState.desktopEn}
                  {!typingState.isComplete && typingState.desktopZh === '' && (
                    <motion.span
                      className="w-1 h-12 xl:h-14 bg-gray-900 dark:bg-white ml-1 inline-block"
                      animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ 
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  )}
                </h1>
              </div>
              
              <div className="relative text-center">
                <h2 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight inline-flex items-baseline">
                  {typingState.desktopZh}
                  {typingState.desktopZh !== '' && (
                    <motion.span
                      className="w-1 h-12 xl:h-14 bg-gray-900 dark:bg-white ml-1 inline-block"
                      animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ 
                        duration: 0.8,
                        repeat: typingState.isComplete ? 0 : Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  )}
                </h2>
              </div>
            </div>
          )}
        </motion.div>

        {/* 操作按钮 */}
        <AnimatePresence>
          {typingState.showButtons && (
            <motion.div
              className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center sm:items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              // ✨ TWEAK: 为按钮容器添加 delay，实现丝滑的级联动画效果
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
              <motion.button
                onClick={handleExplore}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl
                         shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-300 ease-out
                         focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">探索PoT Academy</span>
              </motion.button>

              <motion.button
                onClick={handleLogin}
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl
                         hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-300 ease-out
                         focus:outline-none focus:ring-4 focus:ring-gray-500/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">我已经是PoT的一员</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 品牌标识（可选） */}
        <motion.div 
          className="mt-16 text-gray-400 dark:text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: typingState.showButtons ? 1 : 0 }}
          transition={{ delay: typingState.showButtons ? 0.5 : 0, duration: 0.8 }}
        >
          <p className="text-sm">Proof of Thought Academy</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OnboardingEntrance;