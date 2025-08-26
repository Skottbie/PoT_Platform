// client/src/pages/OnboardingEntrance.jsx - Step 1→Step 2 完整实现
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

const OnboardingEntrance = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 新增：步骤控制
  const [typingState, setTypingState] = useState({
    // Step 1 状态
    desktopEn: '', // Join the Future of Thinking.
    desktopZh: '', // 思考，未曾如此。
    mobileFirst: '', // 思考，
    mobileSecond: '', // 未曾如此。
    // Step 2 状态
    step2Text: '', // 选择你的身份。
    showCursor: true,
    isComplete: false,
    currentTypingColumn: 1, // 1: 第一列, 2: 第二列
    isBackspacing: false, // 新增：回撤状态
    backspaceComplete: false // 新增：回撤完成状态
  });

  const sloganControls = useAnimation();
  const buttonsControls = useAnimation();
  const brandControls = useAnimation();

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
    step1: {
      desktop: {
        en: 'Join the Future of Thinking.',
        zh: '思考，未曾如此。'
      },
      mobile: {
        first: '思考，',
        second: '未曾如此。'
      }
    },
    step2: {
      text: '选择你的身份。'
    }
  }), []);

  // Step1 打字动画效果
  const runStep1Animation = useCallback(() => {
    let timeouts = [];
    let blinkInterval;

    const handleStep1Complete = () => {
      setTypingState(prev => ({ ...prev, isComplete: true }));
      
      let blinkCount = 0;
      blinkInterval = setInterval(() => {
        setTypingState(prev => ({ ...prev, showCursor: !prev.showCursor }));
        blinkCount++;
        if (blinkCount >= 4) {
          clearInterval(blinkInterval);
          setTypingState(prev => ({ ...prev, showCursor: false }));

          // 动画串联优化：同时启动标语上移和按钮出现动画
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
              delay: 0.3
            }
          });

          brandControls.start({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 1.0,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.8
            }
            });
        }
      }, 350);
    };

    if (isMobile) {
      setTypingState(prev => ({ ...prev, currentTypingColumn: 1 }));
      for (let i = 0; i <= texts.step1.mobile.first.length; i++) {
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({
            ...prev,
            mobileFirst: texts.step1.mobile.first.slice(0, i)
          }));
        }, i * 100));
      }

      const firstColDelay = texts.step1.mobile.first.length * 100 + 300;
      
      timeouts.push(setTimeout(() => {
        setTypingState(prev => ({ ...prev, currentTypingColumn: 2 }));
      }, firstColDelay));

      for (let i = 0; i <= texts.step1.mobile.second.length; i++) {
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({
            ...prev,
            mobileSecond: texts.step1.mobile.second.slice(0, i)
          }));
        }, firstColDelay + i * 100));
      }

      const totalDelay = firstColDelay + texts.step1.mobile.second.length * 100;
      timeouts.push(setTimeout(handleStep1Complete, totalDelay));

    } else {
      for (let i = 0; i <= texts.step1.desktop.en.length; i++) {
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({
            ...prev,
            desktopEn: texts.step1.desktop.en.slice(0, i)
          }));
        }, i * 80));
      }

      const enLineDelay = texts.step1.desktop.en.length * 80 + 300;
      for (let i = 0; i <= texts.step1.desktop.zh.length; i++) {
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({
            ...prev,
            desktopZh: texts.step1.desktop.zh.slice(0, i)
          }));
        }, enLineDelay + i * 100));
      }

      const totalDelay = enLineDelay + texts.step1.desktop.zh.length * 100;
      timeouts.push(setTimeout(handleStep1Complete, totalDelay));
    }

    return timeouts;
  }, [isMobile, texts.step1, sloganControls, buttonsControls]);

  // Step1→Step2 回撤动画
  const runBackspaceAnimation = useCallback(() => {
    let timeouts = [];
    
    setTypingState(prev => ({ 
      ...prev, 
      isBackspacing: true,
      showCursor: true,
      isComplete: false 
    }));

    if (isMobile) {
      // 移动端：先回撤第二列，再回撤第一列
      const secondText = texts.step1.mobile.second;
      for (let i = secondText.length; i >= 0; i--) {
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({
            ...prev,
            mobileSecond: secondText.slice(0, i),
            currentTypingColumn: 2
          }));
        }, (secondText.length - i) * 50));
      }

      const secondColDelay = secondText.length * 50 + 200;
      timeouts.push(setTimeout(() => {
        setTypingState(prev => ({ ...prev, currentTypingColumn: 1 }));
      }, secondColDelay));

      const firstText = texts.step1.mobile.first;
      for (let i = firstText.length; i >= 0; i--) {
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({
            ...prev,
            mobileFirst: firstText.slice(0, i)
          }));
        }, secondColDelay + (firstText.length - i) * 50));
      }

      const totalBackspaceDelay = secondColDelay + firstText.length * 50 + 300;
      timeouts.push(setTimeout(() => {
        setTypingState(prev => ({ 
          ...prev, 
          backspaceComplete: true,
          currentTypingColumn: 1
        }));
      }, totalBackspaceDelay));

    } else {
      // 桌面端：先回撤中文，再回撤英文
      const zhText = texts.step1.desktop.zh;
      for (let i = zhText.length; i >= 0; i--) {
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({
            ...prev,
            desktopZh: zhText.slice(0, i)
          }));
        }, (zhText.length - i) * 60));
      }

      const zhDelay = zhText.length * 60 + 200;
      const enText = texts.step1.desktop.en;
      for (let i = enText.length; i >= 0; i--) {
        timeouts.push(setTimeout(() => {
          setTypingState(prev => ({
            ...prev,
            desktopEn: enText.slice(0, i)
          }));
        }, zhDelay + (enText.length - i) * 60));
      }

      const totalBackspaceDelay = zhDelay + enText.length * 60 + 300;
      timeouts.push(setTimeout(() => {
        setTypingState(prev => ({ 
          ...prev, 
          backspaceComplete: true 
        }));
      }, totalBackspaceDelay));
    }

    return timeouts;
  }, [isMobile, texts.step1]);

  // Step2 打字动画
  const runStep2Animation = useCallback(() => {
    let timeouts = [];
    let blinkInterval;

    const step2Text = texts.step2.text;
    
    // 重置状态并开始打字
    setTypingState(prev => ({
      ...prev,
      step2Text: '',
      showCursor: true,
      isComplete: false,
      isBackspacing: false,
      backspaceComplete: false // 重置回撤完成状态
    }));

    // Step2 打字动画（横向显示）
    for (let i = 0; i <= step2Text.length; i++) {
      timeouts.push(setTimeout(() => {
        setTypingState(prev => ({
          ...prev,
          step2Text: step2Text.slice(0, i)
        }));
      }, i * 120));
    }

    const typingDelay = step2Text.length * 120;
    timeouts.push(setTimeout(() => {
      setTypingState(prev => ({ ...prev, isComplete: true }));
      
      // 游标闪烁
      let blinkCount = 0;
      blinkInterval = setInterval(() => {
        setTypingState(prev => ({ ...prev, showCursor: !prev.showCursor }));
        blinkCount++;
        if (blinkCount >= 4) {
          clearInterval(blinkInterval);
          blinkInterval = null;
          setTypingState(prev => ({ ...prev, showCursor: false }));

          // 显示Step2按钮
          buttonsControls.start({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.2
            }
          });
        }
      }, 400);
    }, typingDelay));

    // 返回清理函数
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (blinkInterval) {
        clearInterval(blinkInterval);
      }
    };
  }, [texts.step2, buttonsControls]);

  // Step1初始动画
  useEffect(() => {
    if (currentStep === 1) {
      const timeouts = runStep1Animation();
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [currentStep, runStep1Animation]);

  // Step1→Step2过渡处理
  const handleExploreClick = useCallback(async () => {
    // 1. 按钮渐隐
    await buttonsControls.start({
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    });

    // 2. 开始回撤动画
    runBackspaceAnimation();
    
    // 3. 计算回撤总时间并切换到Step2
    let totalBackspaceTime;
    if (isMobile) {
      const secondTextLen = texts.step1.mobile.second.length;
      const firstTextLen = texts.step1.mobile.first.length;
      totalBackspaceTime = secondTextLen * 50 + 200 + firstTextLen * 50 + 300;
    } else {
      const zhTextLen = texts.step1.desktop.zh.length;
      const enTextLen = texts.step1.desktop.en.length;
      totalBackspaceTime = zhTextLen * 60 + 200 + enTextLen * 60 + 300;
    }

    // 4. 回撤完成后切换到Step2
    setTimeout(() => {
      setCurrentStep(2);
      // 延迟开始Step2动画
      setTimeout(() => {
        runStep2Animation();
      }, 200);
    }, totalBackspaceTime);

  }, [buttonsControls, runBackspaceAnimation, runStep2Animation, isMobile, texts.step1]);

  // 其他按钮点击处理
  const handleLogin = useCallback(() => {
    navigate('/login', { 
      state: { from: 'entrance' },
      replace: false 
    });
  }, [navigate]);

  const handleTeacherSelect = useCallback(() => {
        // 添加按钮渐隐动画
        buttonsControls.start({
        opacity: 0,
        y: 30,
        scale: 0.95,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
        });

        // 添加文案回撤动画
        sloganControls.start({
        opacity: 0,
        y: -30,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
        });

        // 延迟跳转，确保动画完成
        setTimeout(() => {
        navigate('/onboarding/features', {
            state: { role: 'teacher', from: 'identity' },
            replace: false
        });
        }, 800); // 与动画时长匹配
    }, [navigate, buttonsControls, sloganControls]);

    const handleStudentSelect = useCallback(() => {
        // 添加按钮渐隐动画
        buttonsControls.start({
        opacity: 0,
        y: 30,
        scale: 0.95,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
        });

        // 添加文案回撤动画
        sloganControls.start({
        opacity: 0,
        y: -30,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
        });

        // 延迟跳转，确保动画完成
        setTimeout(() => {
        navigate('/onboarding/features', {
            state: { role: 'student', from: 'identity' },
            replace: false
        });
        }, 800); // 与动画时长匹配
    }, [navigate, buttonsControls, sloganControls]);

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
                repeat: typingState.isBackspacing ? Infinity : 0,
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
                repeat: typingState.isBackspacing ? Infinity : 0,
                repeatType: "reverse"
              }}
            />
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 overflow-hidden fixed inset-0">
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
        {/* 标语区域 */}
        <motion.div 
          className={isMobile ? "mb-2" : "mb-8"}
          animate={sloganControls}
          initial={{ y: 0 }}
        >
          {currentStep === 1 ? (
            // Step 1 标语
            isMobile ? (
              <div className="flex justify-center items-start gap-4">
                <VerticalText 
                  text={typingState.mobileFirst}
                  showCursor={typingState.currentTypingColumn === 1 && (typingState.showCursor || typingState.isBackspacing)}
                  className="transform transition-transform duration-300"
                />
                
                <VerticalText 
                  text={typingState.mobileSecond}
                  showCursor={typingState.currentTypingColumn === 2 && (typingState.showCursor || typingState.isBackspacing)}
                  className="transform transition-transform duration-300"
                />
              </div>
            ) : (
              <div 
                className="space-y-6 flex flex-col items-center"
                style={{ transform: 'translateX(12px)' }}
              >
                <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                  {typingState.desktopEn}
                  {typingState.desktopZh === '' && (typingState.showCursor || typingState.isBackspacing) && (
                    <motion.span
                      className="w-1 h-12 xl:h-14 bg-gray-900 dark:bg-white ml-1 inline-block"
                      animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ 
                        duration: 0.6,
                        repeat: typingState.isBackspacing ? Infinity : 0,
                        repeatType: "reverse"
                      }}
                    />
                  )}
                </h1>
                <h2 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                  {typingState.desktopZh}
                  {typingState.desktopZh !== '' && (typingState.showCursor || typingState.isBackspacing) && (
                    <motion.span
                      className="w-1 h-12 xl:h-14 bg-gray-900 dark:bg-white ml-1 inline-block"
                      animate={typingState.showCursor ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ 
                        duration: 0.6,
                        repeat: typingState.isBackspacing ? Infinity : 0,
                        repeatType: "reverse"
                      }}
                    />
                  )}
                </h2>
              </div>
            )
          ) : (
            // Step 2 标语（横向显示）
            <div className="text-center">
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                {typingState.step2Text}
                {(typingState.showCursor || !typingState.isComplete) && (
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
              </h1>
            </div>
          )}
        </motion.div>

        {/* 按钮区域 */}
        <AnimatePresence>
          {currentStep === 1 && (
            <motion.div
              className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center sm:items-center"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={buttonsControls}
            >
              <motion.button
                onClick={handleExploreClick}
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
                <span className="text-base sm:text-lg">早已经是PoT的一员</span>
              </motion.button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center sm:items-center"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={buttonsControls}
            >
              <motion.button
                onClick={handleStudentSelect}
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
                <span className="text-base sm:text-lg">我是学生 - 探求真知。</span>
              </motion.button>

              <motion.button
                onClick={handleTeacherSelect}
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
                <span className="text-base sm:text-lg">我是教师 - 启发思辨。</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部品牌标识 */}
        <motion.div 
        className="mt-16 text-gray-400 dark:text-gray-600"
        initial={{ opacity: 0 }}
        animate={brandControls}
        transition={{ delay: 0.8, duration: 1.0 }}
        >
        <p className="text-sm font-light tracking-wide">© 2025 PoTAcademy. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OnboardingEntrance;