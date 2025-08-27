// client/src/pages/OnboardingFeatures.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
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
  
  // 🆕 滑动指示器状态
  const [showNavigationControls, setShowNavigationControls] = useState(false);
  const [isFirstShow, setIsFirstShow] = useState(true);
  const [swiperRef, setSwiperRef] = useState(null);

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

  // 🆕 扩展功能数据配置（Apple文风）
  const featuresData = {
    teacher: [
      {
        icon: Search,
        title: "学生AI使用全透明，教学超安心。",
        description: "AI交互原始记录随任务捆绑提交，用好AI or 滥用AI？证据已到位，你说了算。",
        detailedDescription: "每次学生与AI的对话记录都会完整保存并随作业一同提交。查看学生的思考过程、AI的引导轨迹，以及最终的成果输出。从问题提出到答案生成，整个协作链条一览无余，让您精准掌握学生的真实能力与AI依赖程度。",
        benefits: ["完整AI对话记录", "思考过程可视化", "学术诚信保障", "个性化指导依据"],
        placeholder: "AI使用记录截图占位符"
      },
      {
        icon: Brain,
        title: "思维轨迹，一目了然。",
        description: "定制PoT-Mode智能体引导学生思考，精准把握掌握程度，个性化指导更高效，教学更轻松。",
        detailedDescription: "PoT智能体采用苏格拉底式提问，循循善诱地引导学生独立思考。不给答案，只给启发。通过分析学生的回答模式、思维深度和推理逻辑，生成个性化的思维能力画像，帮您发现每位学生的认知特点与潜力。",
        benefits: ["苏格拉底式引导", "思维能力画像", "认知特点分析", "个性化教学建议"],
        placeholder: "思维轨迹可视化截图占位符"
      },
      {
        icon: Zap,
        title: "教学管理，简约而强大。",
        description: "任务发布、班级管理、提交查阅，在手机上也能轻松完成。",
        detailedDescription: "一站式教学工作台，从任务创建到成果评阅，全流程移动化操作。智能推荐任务模板，批量管理多个班级，实时掌握提交进度。让繁琐的教务工作变得如iPhone般简约易用。",
        benefits: ["移动端全功能", "智能任务模板", "批量班级管理", "实时进度追踪"],
        placeholder: "教学管理界面截图占位符"
      }
    ],
    student: [
      {
        icon: Bot,
        title: "PoT-Mode，启发不代替。",
        description: "PoT定制模型，个性化高效指导。所有任务，保质还保量。",
        detailedDescription: "专为学术思维训练设计的AI伙伴。它不会直接给出答案，而是通过精心设计的问题引导你深入思考。就像一位智慧的导师，帮你发现问题的本质，构建属于自己的知识框架。",
        benefits: ["启发式对话", "个性化引导", "思维能力提升", "学术诚信保障"],
        placeholder: "PoT对话界面截图占位符"
      },
      {
        icon: Shield,
        title: "AI使用透明化，学术无忧。",
        description: "记录AI协作全过程，展现真实思考轨迹。负责任的AI助力，提交作业更自信。",
        detailedDescription: "每一次AI协作都被完整记录，形成你的专属学习档案。向老师展示你的思考历程，证明你的学术诚信。在AI时代，透明度就是你的竞争优势。",
        benefits: ["完整协作记录", "学术诚信证明", "思考过程展示", "老师信任建立"],
        placeholder: "学术诚信记录截图占位符"
      },
      {
        icon: Layers,
        title: "开始你的思考，AI友情客串。",
        description: "接入多种强力AIGC模型，移动端原生体验，学习无界限。",
        detailedDescription: "集成ChatGPT、Claude、文心一言等顶级AI模型，根据任务需求智能推荐最适合的助手。无论是文本创作、数据分析还是创意设计，都能获得专业级的协助。原生移动体验，随时随地开启深度学习。",
        benefits: ["多模型集成", "智能模型推荐", "原生移动体验", "专业级协助"],
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

  // 🆕 滑动指示器延迟显示动画
  useEffect(() => {
    if (isMobile) {
      setTimeout(() => {
        setShowNavigationControls(true);
        // 入场动画结束后标记为非首次
        setTimeout(() => {
          setIsFirstShow(false);
        }, 1200); // 等待入场动画完成
      }, 1400);
    }
  }, [isMobile]);

  // Swiper 滑动事件处理
  const handleSlideChange = useCallback((swiper) => {
    const newIndex = swiper.activeIndex;
    setCurrentIndex(newIndex);
    if (newIndex === currentFeatures.length) {
      setShowFinalCTA(true);
    } else {
      setShowFinalCTA(false);
    }
  }, [currentFeatures.length]);

  // 移动端滑动控制
  const handleNext = useCallback(() => {
    if (swiperRef && currentIndex < currentFeatures.length) {
      swiperRef.slideNext();
    }
  }, [swiperRef, currentIndex, currentFeatures.length]);

  const handlePrev = useCallback(() => {
    if (swiperRef && currentIndex > 0) {
      swiperRef.slidePrev();
    }
  }, [swiperRef, currentIndex]);

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

  // 🆕 Apple风格功能卡片组件（桌面端）
  const FeatureCard = ({ feature, index, onClick }) => {
    const IconComponent = feature.icon;
    
    return (
      <motion.div
        className="relative bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 
                   border border-gray-200/60 dark:border-gray-700/60 
                   hover:bg-white dark:hover:bg-gray-900/95 
                   transition-all duration-500 ease-out cursor-pointer
                   hover:shadow-2xl hover:shadow-gray-900/10 dark:hover:shadow-black/20
                   hover:scale-[1.02] active:scale-[0.98]
                   min-h-[280px] flex flex-col justify-between"
        variants={{
          hidden: { opacity: 0, y: 40, scale: 0.95 },
          visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: {
              duration: 0.7,
              ease: [0.25, 0.46, 0.45, 0.94]
            }
          }
        }}
        onClick={() => onClick(feature)}
        whileHover={{ 
          y: -8,
          scale: 1.02,
          transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 左上角大图标 */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 
                          dark:from-gray-800 dark:to-gray-700 
                          flex items-center justify-center shadow-inner">
            <IconComponent className="w-8 h-8 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
          </div>
        </div>

        {/* 主体内容 */}
        <div className="flex-1">
          {/* 标题 - 加大字号和字重 */}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {feature.title}
          </h3>

          {/* 描述 - 优化排版和字号 */}
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base font-medium">
            {feature.description}
          </p>
        </div>

        {/* 右下角大加号 */}
        <div className="absolute bottom-8 right-8">
          <div className="w-10 h-10 rounded-full bg-gray-900/10 dark:bg-white/10 
                          hover:bg-gray-900/20 dark:hover:bg-white/20
                          flex items-center justify-center transition-all duration-300
                          hover:scale-110">
            <Plus className="w-6 h-6 text-gray-700 dark:text-gray-300" strokeWidth={2} />
          </div>
        </div>

        {/* Apple风格装饰线 */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r 
                        from-transparent via-gray-300/50 to-transparent 
                        dark:via-gray-600/50"></div>
      </motion.div>
    );
  };

  // 🆕 移动端Apple风格长矩形卡片组件
  const MobileFeatureCard = ({ feature, onClick }) => {
    const IconComponent = feature.icon;
    
    return (
      <div 
        className="bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 
                   border border-gray-200/60 dark:border-gray-700/60 
                   shadow-xl shadow-gray-900/5 dark:shadow-black/20
                   hover:shadow-2xl hover:shadow-gray-900/10 dark:hover:shadow-black/30
                   transition-all duration-500 cursor-pointer
                   h-[400px] relative overflow-hidden flex flex-col justify-between"
        onClick={() => onClick(feature)}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 
                        dark:to-gray-800/50 pointer-events-none"></div>
        
        {/* 内容层 */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* 上半部分：图标和内容 */}
          <div>
            {/* 左上角大图标 */}
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 
                              dark:from-gray-800 dark:to-gray-700 
                              flex items-center justify-center shadow-inner">
                <IconComponent className="w-8 h-8 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
              </div>
            </div>

            {/* 标题 - 移动端大字号 */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {feature.title}
            </h3>

            {/* 描述 - 移动端优化 */}
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg font-medium">
              {feature.description}
            </p>
          </div>

          {/* 下半部分：右下角加号 */}
          <div className="flex justify-end">
            <div className="w-12 h-12 rounded-full bg-gray-900/10 dark:bg-white/10 
                            flex items-center justify-center">
              <Plus className="w-7 h-7 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🆕 Apple风格滑动控制器
  const AppleStyleNavigation = () => (
    <AnimatePresence>
      {showNavigationControls && (
        <motion.div 
          className="flex justify-start items-center mt-8 pr-4"
          initial={isFirstShow ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center space-x-1 bg-white/80 dark:bg-gray-900/80 
                          backdrop-blur-2xl rounded-3xl p-0.5 
                          border border-gray-200/50 dark:border-gray-700/50
                          shadow-lg shadow-gray-900/10 dark:shadow-black/20">
            
            {/* 左箭头 */}
            <motion.button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-11 h-11 rounded-xl bg-transparent hover:bg-gray-100/80 
                         dark:hover:bg-gray-700/50 
                         disabled:opacity-30 disabled:cursor-not-allowed
                         flex items-center justify-center transition-all duration-300
                         active:scale-95 aigc-native-button"
              whileHover={{ scale: currentIndex === 0 ? 1 : 1.05 }}
              whileTap={{ scale: currentIndex === 0 ? 1 : 0.95 }}
            >
              <ChevronLeft 
                className="w-6 h-6 text-gray-700 dark:text-gray-300" 
                strokeWidth={2.5} 
              />
            </motion.button>

            {/* 分隔线 */}
            <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-600/50"></div>

            {/* 右箭头 */}
            <motion.button
              onClick={handleNext}
              disabled={currentIndex >= currentFeatures.length}
              className="w-11 h-11 rounded-xl bg-transparent hover:bg-gray-100/80 
                         dark:hover:bg-gray-700/50 
                         disabled:opacity-30 disabled:cursor-not-allowed
                         flex items-center justify-center transition-all duration-300
                         active:scale-95 aigc-native-button"
              whileHover={{ scale: currentIndex >= currentFeatures.length ? 1 : 1.05 }}
              whileTap={{ scale: currentIndex >= currentFeatures.length ? 1 : 0.95 }}
            >
              <ChevronRight 
                className="w-6 h-6 text-gray-700 dark:text-gray-300" 
                strokeWidth={2.5} 
              />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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
                    
                    {/* 详细描述 */}
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base mb-6">
                      {feature.detailedDescription}
                    </p>

                    {/* 核心优势 */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        核心优势
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {feature.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 
                                                     bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 配图区域占位符 */}
                  <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {feature.placeholder}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  // 桌面端最终CTA组件（保持原有逻辑）
  const DesktopFinalCTA = () => (
    <AnimatePresence>
      {showDesktopCTA && (
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <motion.div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
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

  // 移动端最终CTA组件（保持原有逻辑）
  const MobileFinalCTA = () => (
    <AnimatePresence>
      {showFinalCTA && (
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ 
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <motion.div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
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
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 
                    dark:from-gray-900 dark:via-gray-800 dark:to-purple-900
                    flex flex-col items-center justify-center px-4 py-safe overflow-hidden">
      
      <motion.div
        className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center"
        initial={{ opacity: 0 }}
        animate={pageControls}
      >
        {/* 内容区域 - 确保在视窗内 */}
        <div className="flex-1 flex flex-col justify-center max-h-full overflow-hidden">
          
          {/* 页面标题 */}
          <motion.div
            className="text-left mb-8 lg:mb-12"
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
              className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-8 h-[380px]"
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
            <div className="relative flex-1 max-h-[calc(100vh-200px)] overflow-hidden mb-8">
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
                <Swiper
                  onSwiper={setSwiperRef}
                  onSlideChange={handleSlideChange}
                  modules={[Navigation]}
                  spaceBetween={16}
                  slidesPerView={1}
                  allowTouchMove={true}
                  simulateTouch={true}
                  touchStartPreventDefault={false}
                  className="mobile-feature-swiper"
                >
                  {/* 功能卡片 */}
                  {currentFeatures.map((feature, index) => (
                    <SwiperSlide key={index} className="px-4">
                      <MobileFeatureCard feature={feature} onClick={handleCardClick} />
                    </SwiperSlide>
                  ))}
                  
                  {/* 移动端CTA卡片 */}
                  <SwiperSlide className="px-4">
                    <div className="bg-white/90 dark:bg-gray-100/10 backdrop-blur-sm rounded-3xl p-8 
                                    shadow-sm border border-gray-200/30 dark:border-gray-700/30
                                    h-[400px] flex flex-col items-center justify-center">
                      <MobileFinalCTA />
                    </div>
                  </SwiperSlide>
                </Swiper>
              </motion.div>

              {/* 🆕 Apple风格滑动控制按钮 */}
              <AppleStyleNavigation />
            </div>
          )}

          {/* 桌面端CTA */}
          <DesktopFinalCTA />
        </div>
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