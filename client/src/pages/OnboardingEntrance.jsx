// client/src/pages/OnboardingEntrance.jsx - Step 1: 引导入口页面 (深度优化版)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

const OnboardingEntrance = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [typingState, setTypingState] = useState({
    desktopEn: '', // Join the Future of Thinking.
    desktopZh: '', // 思考，未曾如此。
    mobileFirst: '', // 思考，
    mobileSecond: '', // 未曾如此。
    showCursor: true,
    isComplete: false,
    currentTypingColumn: 1 // 1: 第一列, 2: 第二列
  });

  const sloganControls = useAnimation();
  const buttonsControls = useAnimation();

  // 增强的设备检测
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(iOS);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 文字内容配置
  const texts = useMemo(() => ({
    desktop: {
      en: 'Join the Future of Thinking.',
      zh: '思考，未曾如此。'
    },
    mobile: {
      first: '思考，',
      second: '未曾如此。'
    }
  }), []);

  // 优化的打字动画效果
  useEffect(() => {
    let timeouts = [];
    let blinkInterval;

    const typeText = async () => {
      const handleTypingComplete = () => {
        setTypingState(prev => ({ ...prev, isComplete: true }));
        
        let blinkCount = 0;
        blinkInterval = setInterval(() => {
          setTypingState(prev => ({ ...prev, showCursor: !prev.showCursor }));
          blinkCount++;
          if (blinkCount >= 4) {
            clearInterval(blinkInterval);
            setTypingState(prev => ({ ...prev, showCursor: false }));

            // 🆕 动画串联优化：同时启动标语上移和按钮出现动画
            sloganControls.start({
              y: -50,
              transition: {
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }
            });

            buttonsControls.start({
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.3 // 🆕 增加微小延迟，让上移动画先“起步”
              }
            });
          }
        }, 350);
      };

      if (isMobile) {
        setTypingState(prev => ({ ...prev, currentTypingColumn: 1 }));
        for (let i = 0; i <= texts.mobile.first.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              mobileFirst: texts.mobile.first.slice(0, i)
            }));
          }, i * 100));
        }

        const firstColDelay = texts.mobile.first.length * 100 + 300;
        
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({ ...prev, currentTypingColumn: 2 }));
        }, firstColDelay));

        for (let i = 0; i <= texts.mobile.second.length; i++) {
          timeouts.push(setTimeout(() => {
            setTypingState(prev => ({
              ...prev,
              mobileSecond: texts.mobile.second.slice(0, i)
            }));
          }, firstColDelay + i * 100));
        }

        const totalDelay = firstColDelay + texts.mobile.second.length * 100;
        timeouts.push(setTimeout(handleTypingComplete, totalDelay));

      } else {
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
  }, [isMobile, texts, sloganControls, buttonsControls]);

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

  // iOS兼容的竖排文字组件
  const VerticalText = ({ text, showCursor, className }) => {
    if (isIOS) {
      return (
        <div className={`flex flex-col items-center ${className}`}>
          {text.split('').map((char, index) => (
            <span 
              key={index} 
              className="text-[2.75rem] sm:text-[3.5rem] font-bold text-gray-900 dark:text-white leading-tight"
              style={{ 
                marginBottom: '0.05em',
                lineHeight: 1.1
              }}
            >
              {char}
            </span>
          ))}
          {showCursor && (
            <motion.div
              className="w-8 h-1 bg-gray-900 dark:bg-white mt-1"
              animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
              transition={{ 
                duration: 0.6,
                repeat: typingState.isComplete ? 0 : Infinity,
                repeatType: "reverse"
              }}
            />
          )}
        </div>
      );
    } else {
      return (
        <div className={`flex flex-col items-center ${className}`}>
          <p 
            className="text-[2.75rem] sm:text-[3.5rem] font-bold text-gray-900 dark:text-white"
            style={{ 
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              letterSpacing: '0.1em'
            }}
          >
            {text}
          </p>
          {showCursor && (
            <motion.div
              className="w-8 h-1 bg-gray-900 dark:bg-white mt-4"
              animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
              transition={{ 
                duration: 0.6,
                repeat: typingState.isComplete ? 0 : Infinity,
                repeatType: "reverse"
              }}
            />
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <motion.div 
        className="text-center max-w-4xl mx-auto relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ 
          transform: 'translate3d(0, 0, 0)',
          willChange: typingState.showButtons ? 'transform' : 'auto'
        }}
      >
        {/* 🆕 移动端间距优化：使用三元表达式动态调整 margin */}
        <motion.div 
          className={isMobile ? "mb-2" : "mb-8"}
          animate={sloganControls}
          initial={{ y: 0 }}
        >
          {isMobile ? (
            <div className="flex justify-center items-start gap-4">
              <VerticalText 
                text={typingState.mobileFirst}
                showCursor={!typingState.isComplete && typingState.currentTypingColumn === 1}
                className="transform transition-transform duration-300"
              />
              
              <VerticalText 
                text={typingState.mobileSecond}
                showCursor={typingState.currentTypingColumn === 2}
                className="transform transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center">
            <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                {typingState.desktopEn}
                {!typingState.isComplete && typingState.desktopZh === '' && (
                <motion.span
                    className="w-1 h-12 xl:h-14 bg-gray-900 dark:bg-white ml-1 inline-block"
                    animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse"
                    }}
                />
                )}
            </h1>
            <h2 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                {typingState.desktopZh}
                {typingState.desktopZh !== '' && (
                <motion.span
                    className="w-1 h-12 xl:h-14 bg-gray-900 dark:bg-white ml-1 inline-block"
                    animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ 
                    duration: 0.6,
                    repeat: typingState.isComplete ? 0 : Infinity,
                    repeatType: "reverse"
                    }}
                />
                )}
            </h2>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          <motion.div
            className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center sm:items-center"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={buttonsControls}
          >
            <motion.button
            onClick={handleExplore}
            className="w-full sm:w-auto px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl
                    shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-4 focus:ring-blue-500/50"
            whileHover={{ 
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
            <span className="text-base sm:text-lg">探索PoT Academy</span>
            </motion.button>

            <motion.button
            onClick={handleLogin}
            className="w-full sm:w-auto px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl
                    hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:scale-[1.02] active:scale-[0.98]
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-4 focus:ring-gray-500/50"
            whileHover={{ 
                scale: 1.02,
                backgroundColor: "rgba(249, 250, 251, 0.8)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
            <span className="text-base sm:text-lg">我已经是PoT的一员</span>
            </motion.button>
          </motion.div>
        </AnimatePresence>

        <motion.div 
          className="mt-16 text-gray-400 dark:text-gray-600"
          initial={{ opacity: 0 }}
          animate={buttonsControls}
          transition={{ delay: 0.8, duration: 1.0 }}
        >
          <p className="text-sm font-light tracking-wide">Proof of Thought Academy</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OnboardingEntrance;