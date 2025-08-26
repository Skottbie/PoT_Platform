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
  ChevronRight,
  Plus,
  X
} from 'lucide-react';

const OnboardingFeatures = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role = 'teacher' } = location.state || {};
  
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinalCTA, setShowFinalCTA] = useState(false);
  const [showDesktopCTA, setShowDesktopCTA] = useState(false);
  
  // 🆕 模态框相关状态
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // 🆕 移动端滑动相关状态
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const pageControls = useAnimation();
  const headerControls = useAnimation();
  const cardsControls = useAnimation();

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

  // 页面进入动画
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

      if (!isMobile) {
        setTimeout(() => {
          setShowDesktopCTA(true);
        }, 2000);
      }
    };

    runEntranceAnimation();
  }, [pageControls, headerControls, cardsControls, isMobile]);

  // 🆕 移动端滑动事件处理
  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < currentFeatures.length) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrev();
    }
  }, [touchStart, touchEnd, currentIndex, currentFeatures.length]);

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
      if (newIndex < currentFeatures.length) {
        setShowFinalCTA(false);
      }
    }
  }, [currentIndex, currentFeatures.length]);

  // 🆕 卡片点击处理
  const handleCardClick = useCallback((feature) => {
    setSelectedFeature(feature);
    setShowModal(true);
  }, []);

  // 🆕 模态框关闭处理
  const closeModal = useCallback(() => {
    setShowModal(false);
    setTimeout(() => setSelectedFeature(null), 300); // 等待动画完成后清空
  }, []);

  // CTA点击处理
  const handleJoinPoT = useCallback(() => {
    navigate('/login', {
      state: { role, from: 'features' },
      replace: false
    });
  }, [navigate, role]);

  // 🆕 Apple风格功能卡片组件
  const FeatureCard = ({ feature, index, onClick }) => {
    const IconComponent = feature.icon;
    
    return (
      <motion.div
        className="relative bg-white/90 dark:bg-gray-100/10 backdrop-blur-sm rounded-2xl p-6 
                   border border-gray-200/30 dark:border-gray-700/30 
                   hover:bg-white/95 dark:hover:bg-gray-100/15 transition-all duration-300 cursor-pointer
                   hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50
                   hover:-translate-y-0.5"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94]
            }
          }
        }}
        onClick={() => onClick(feature)}
        whileHover={{ 
          y: -2,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 左上角图标 */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800/50 
                          flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 leading-tight">
          {feature.title}
        </h3>

        {/* 描述 */}
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
          {feature.description}
        </p>

        {/* 右下角加号 */}
        <div className="absolute bottom-6 right-6">
          <div className="w-6 h-6 rounded-full bg-gray-200/50 dark:bg-gray-700/50 
                          flex items-center justify-center">
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>
    );
  };

  // 🆕 移动端简化卡片组件（用于滑动视图）
  const MobileFeatureCard = ({ feature, onClick }) => {
    const IconComponent = feature.icon;
    
    return (
      <div 
        className="bg-white/90 dark:bg-gray-100/10 backdrop-blur-sm rounded-2xl p-6 
                   border border-gray-200/30 dark:border-gray-700/30 
                   hover:bg-white/95 dark:hover:bg-gray-100/15 transition-all duration-300 cursor-pointer
                   shadow-sm hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50
                   relative"
        onClick={() => onClick(feature)}
      >
        {/* 左上角图标 */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800/50 
                          flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 leading-tight">
          {feature.title}
        </h3>

        {/* 描述 */}
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm mb-6">
          {feature.description}
        </p>

        {/* 右下角加号 */}
        <div className="absolute bottom-6 right-6">
          <div className="w-6 h-6 rounded-full bg-gray-200/50 dark:bg-gray-700/50 
                          flex items-center justify-center">
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    );
  };

  // 🆕 功能详情模态框组件
  const FeatureModal = ({ feature, isOpen, onClose, isMobile }) => {
    if (!feature) return null;
    
    const IconComponent = feature.icon;

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
            />
            
            {/* 模态框内容 */}
            <motion.div
              className={`fixed z-50 ${
                isMobile 
                  ? 'inset-x-4 bottom-4 top-20' 
                  : 'top-1/2 left-1/2 w-[600px] max-h-[80vh]'
              }`}
              initial={
                isMobile 
                  ? { y: '100%', opacity: 0 }
                  : { y: '-50%', x: '-50%', scale: 0.9, opacity: 0 }
              }
              animate={
                isMobile
                  ? { y: 0, opacity: 1 }
                  : { y: '-50%', x: '-50%', scale: 1, opacity: 1 }
              }
              exit={
                isMobile
                  ? { y: '100%', opacity: 0 }
                  : { y: '-50%', x: '-50%', scale: 0.9, opacity: 0 }
              }
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.4 
              }}
            >
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl 
                              border border-gray-200/50 dark:border-gray-700/50 
                              shadow-2xl shadow-gray-900/20 dark:shadow-black/40
                              h-full overflow-hidden flex flex-col">
                
                {/* 模态框头部 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800/50 
                                    flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      功能详情
                    </h2>
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800/50 
                               hover:bg-gray-200 dark:hover:bg-gray-700/70
                               flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                  </button>
                </div>

                {/* 模态框内容 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* 功能标题 */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                      {feature.title}
                    </h3>
                    
                    {/* 功能描述 */}
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                      {feature.description}
                    </p>
                  </div>

                  {/* 配图区域 */}
                  <div className="bg-gradient-to-br from-gray-100/50 to-gray-200/50 
                                  dark:from-gray-800/30 dark:to-gray-700/30 
                                  rounded-xl h-64 md:h-80 flex items-center justify-center
                                  border border-gray-200/30 dark:border-gray-700/30">
                    <span className="text-gray-500 dark:text-gray-400 text-sm text-center px-4">
                      {feature.placeholder}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  // 移动端CTA组件
  const MobileFinalCTA = () => (
    <motion.div
      className="text-center py-8 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
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
                   focus:outline-none focus:ring-4 focus:ring-blue-500/50
                   min-w-[160px]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          delay: 0.4, 
          type: "spring", 
          stiffness: 300,
          damping: 20
        }}
        whileTap={{ scale: 0.95 }}
      >
        加入PoT.
      </motion.button>
    </motion.div>
  );

  // 桌面端CTA组件
  const DesktopFinalCTA = () => (
    <AnimatePresence>
      {showDesktopCTA && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
      )}
    </AnimatePresence>
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
            {isTeacher ? '教学' : '学习'}新范式，了解一下。
          </h1>
        </motion.div>

        {/* 桌面端：横向卡片布局 */}
        {!isMobile && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={cardsControls}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  staggerChildren: 0.2
                }
              }
            }}
          >
            {currentFeatures.map((feature, index) => (
              <FeatureCard 
                key={index} 
                feature={feature} 
                index={index} 
                onClick={handleCardClick}
              />
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
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }
                }
              }}
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / (currentFeatures.length + 1))}%)`,
                  width: `${(currentFeatures.length + 1) * 100}%`
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* 功能卡片 */}
                {currentFeatures.map((feature, index) => (
                  <div key={index} style={{ width: `${100 / (currentFeatures.length + 1)}%` }} className="flex-shrink-0 px-4">
                    <MobileFeatureCard feature={feature} onClick={handleCardClick} />
                  </div>
                ))}
                
                {/* 移动端CTA卡片 */}
                <div style={{ width: `${100 / (currentFeatures.length + 1)}%` }} className="flex-shrink-0 px-4">
                  <div className="bg-white/90 dark:bg-gray-100/10 backdrop-blur-sm rounded-2xl p-8 
                                  shadow-sm border border-gray-200/30 dark:border-gray-700/30
                                  flex flex-col items-center justify-center min-h-[320px]">
                    <MobileFinalCTA />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 🆕 Apple风格滑动控制按钮（参考图1样式） */}
            <div className="flex justify-center items-center mt-6">
              <div className="flex space-x-2 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 
                              shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-full transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed
                             hover:bg-gray-100 dark:hover:bg-gray-700/70 aigc-native-button"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex >= currentFeatures.length}
                  className="p-2 rounded-full transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed
                             hover:bg-gray-100 dark:hover:bg-gray-700/70 aigc-native-button"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 桌面端CTA */}
        <DesktopFinalCTA />
      </motion.div>

      {/* 🆕 功能详情模态框 */}
      <FeatureModal 
        feature={selectedFeature}
        isOpen={showModal}
        onClose={closeModal}
        isMobile={isMobile}
      />
    </div>
  );
};

export default OnboardingFeatures;