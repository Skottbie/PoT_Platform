// client/src/pages/OnboardingFeatures.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Zap, 
  Bot, 
  Shield, 
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const OnboardingFeatures = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role = 'teacher' } = location.state || {};
  
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinalCTA, setShowFinalCTA] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);

  const pageControls = useAnimation();
  const headerControls = useAnimation();
  const cardsControls = useAnimation();
  const ctaControls = useAnimation(); // 保留但会正确启动

  // 响应式检测
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 功能数据配置
  const featuresData = {
    teacher: [
      {
        icon: Search,
        title: "学生AI使用全透明，教学超安心。",
        description: "AI交互原始记录随任务捆绑提交，用好AI or 滥用AI？证据已到位，决定权在你。",
        placeholder: "AI使用记录截图占位符"
      },
      {
        icon: Brain,
        title: "思维轨迹，一目了然。",
        description: "定制PoT-Mode智能体引导学生思考，精准把握掌握程度，个性化指导更高效，教学更轻松。",
        placeholder: "思维轨迹可视化截图占位符"
      },
      {
        icon: Zap,
        title: "教学管理，简约而强大。",
        description: "任务发布、班级管理、提交查阅，在手机上也能轻松完成。",
        placeholder: "教学管理界面截图占位符"
      }
    ],
    student: [
      {
        icon: Bot,
        title: "PoT-Mode，启发不代替。",
        description: "PoT定制模型，个性化高效指导。所有任务，保质还保量。",
        placeholder: "PoT对话界面截图占位符"
      },
      {
        icon: Shield,
        title: "AI使用透明化，学术无忧。",
        description: "记录AI协作全过程，展现真实思考轨迹。负责任的AI助力，提交作业更自信。",
        placeholder: "学术诚信记录截图占位符"
      },
      {
        icon: Layers,
        title: "开始你的思考，AI友情客串。",
        description: "接入多种强力AIGC模型，移动端原生体验，学习无界限。",
        placeholder: "多模态学习截图占位符"
      }
    ]
  };

  const currentFeatures = featuresData[role];
  const isTeacher = role === 'teacher';

  // 页面进入动画 - 添加ctaControls启动
  useEffect(() => {
    const runEntranceAnimation = async () => {
      await pageControls.start({
        opacity: 1,
        transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
      });

      await headerControls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
      });

      await cardsControls.start({
        opacity: 1,
        y: 0,
        transition: { 
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
          staggerChildren: 0.2
        }
      });

      // 🔧 修复：启动CTA控制器
      await ctaControls.start({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
      });

      setIsAnimated(true);
    };

    runEntranceAnimation();
  }, [pageControls, headerControls, cardsControls, ctaControls]);

  // 移动端滑动控制
  const handleNext = useCallback(() => {
    const newIndex = currentIndex + 1;
    if (newIndex <= currentFeatures.length) {
      setCurrentIndex(newIndex);
      if (newIndex === currentFeatures.length) {
        setShowFinalCTA(true);
      }
    }
  }, [currentIndex, currentFeatures.length]);

  const handlePrev = useCallback(() => {
    const newIndex = currentIndex - 1;
    if (newIndex >= 0) {
      setCurrentIndex(newIndex);
      if (newIndex < currentFeatures.length) { // 🔧 修复：条件逻辑
        setShowFinalCTA(false);
      }
    }
  }, [currentIndex, currentFeatures.length]);

  // CTA点击处理
  const handleJoinPoT = useCallback(() => {
    navigate('/login', {
      state: { role, from: 'features' },
      replace: false
    });
  }, [navigate, role]);

  // 功能卡片组件 - 🔧 修复：移除重复的delay，避免双重交错
  const FeatureCard = ({ feature, index }) => {
    const IconComponent = feature.icon;
    
    return (
      <motion.div
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-xl
                   border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300
                   hover:scale-[1.02] hover:-translate-y-1"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        // 🔧 移除这行避免双重交错: transition={{ delay: index * 0.2 }}
        whileHover={{ 
          scale: 1.02,
          y: -4,
          transition: { duration: 0.3 }
        }}
      >
        {/* 图标区域 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl 
                          flex items-center justify-center shadow-lg">
            <IconComponent className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center leading-tight">
          {feature.title}
        </h3>

        {/* 描述 */}
        <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed mb-6">
          {feature.description}
        </p>

        {/* 占位符图片 */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 
                        rounded-2xl h-48 flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400 text-sm text-center px-4">
            {feature.placeholder}
          </span>
        </div>
      </motion.div>
    );
  };

  // 最终CTA组件 - 🔧 修复：简化条件判断
  const FinalCTA = () => (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={ctaControls}
    >
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }} // 🔧 移除showFinalCTA条件，直接显示
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Proof of Thought.
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          共创AI学习新范式。
        </p>
      </motion.div>

      <motion.button
        onClick={handleJoinPoT}
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold 
                   rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                   hover:scale-[1.05] active:scale-[0.98]
                   focus:outline-none focus:ring-4 focus:ring-blue-500/50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        whileTap={{ scale: 0.98 }}
      >
        加入PoT.
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 
                    dark:from-gray-900 dark:via-gray-800 dark:to-purple-900
                    flex flex-col items-center justify-center px-4 py-8 overflow-hidden">
      
      <motion.div
        className="w-full max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={pageControls}
      >
        {/* 页面标题 */}
        <motion.div
          className="text-left mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={headerControls}
        >
          <h1 className="text-2xl font-light text-gray-700 dark:text-gray-300">
            了解一下{isTeacher ? '教学' : '学习'}新范式。
          </h1>
        </motion.div>

        {/* 桌面端：横向卡片布局 */}
        {!isMobile && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={cardsControls}
          >
            {currentFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </motion.div>
        )}

        {/* 移动端：滑动卡片 */}
        {isMobile && (
          <div className="relative mb-8">
            <motion.div
              className="overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={cardsControls}
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / (currentFeatures.length + 1))}%)`,
                  width: `${(currentFeatures.length + 1) * 100}%`
                }}
              >
                {/* 功能卡片 */}
                {currentFeatures.map((feature, index) => (
                  <div key={index} style={{ width: `${100 / (currentFeatures.length + 1)}%` }} className="flex-shrink-0 px-4">
                    <FeatureCard feature={feature} index={index} />
                  </div>
                ))}
                
                {/* 移动端最终CTA卡片 */}
                <div style={{ width: `${100 / (currentFeatures.length + 1)}%` }} className="flex-shrink-0 px-4">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-8 
                                  shadow-lg border border-gray-200/50 dark:border-gray-700/50
                                  flex flex-col items-center justify-center min-h-[400px]">
                    {/* 🔧 修复：移动端CTA始终显示，不需要showFinalCTA条件 */}
                    <FinalCTA />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 滑动控制按钮 */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>

              {/* 指示器 */}
              <div className="flex space-x-2">
                {[...Array(currentFeatures.length + 1)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentIndex === index 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex >= currentFeatures.length}
                className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* 桌面端最终CTA */}
        <AnimatePresence>
            {!isMobile && isAnimated && (
              <motion.div
                key="desktop-cta"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ delay: 2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center py-12"
              >
                <FinalCTA />
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default OnboardingFeatures;