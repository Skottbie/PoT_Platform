// client/src/pages/OnboardingFeatures.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import React from 'react';
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

  // 🎯 重构后的桌面端CTA组件 - 预留空间稳定布局（修正版）
const DesktopFinalCTA = React.memo(({ showDesktopCTA, handleJoinPoT }) => (
    <motion.div
      className="text-center space-y-6 max-w-lg mx-auto"
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: showDesktopCTA ? 1 : 0,
        transition: { 
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }}
      // 关键：即使不可见也保持空间占用
      style={{ 
        visibility: 'visible', // 始终保持布局空间
        pointerEvents: showDesktopCTA ? 'auto' : 'none' // 控制交互
      }}
    >
      {/* 🆕 紧凑的AI + Brain 图标组合 */}
      <motion.div 
        className="flex items-center justify-center space-x-4 mb-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showDesktopCTA ? 1 : 0,
          scale: showDesktopCTA ? 1 : 0.8,
          transition: { delay: 0.2, duration: 0.5 }
        }}
      >
        {/* Brain 图标（淡雅设计） */}
        <div className="relative group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/50
                          dark:from-gray-800/50 dark:to-gray-700/30
                          border border-gray-200/40 dark:border-gray-700/40
                          flex items-center justify-center shadow-md backdrop-blur-sm
                          group-hover:shadow-lg transition-all duration-300">
            <Brain className="w-6 h-6 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* 连接线 - 霓虹效果 */}
        <motion.div
          className="flex items-center space-x-1"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ 
            scaleX: showDesktopCTA ? 1 : 0,
            opacity: showDesktopCTA ? 1 : 0,
            transition: { delay: 0.4, duration: 0.6 }
          }}
        >
          <div className="w-8 h-0.5 bg-gradient-to-r from-gray-300/40 via-blue-400/60 to-purple-400/60
                          dark:from-gray-600/40 dark:via-blue-400/40 dark:to-purple-400/40 rounded-full"></div>
          <motion.div
            className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400/80 to-purple-400/80 shadow-sm"
            animate={{ 
              boxShadow: showDesktopCTA ? [
                "0 0 4px rgba(168, 85, 247, 0.3)",
                "0 0 8px rgba(168, 85, 247, 0.5)",
                "0 0 4px rgba(168, 85, 247, 0.3)"
              ] : "0 0 0px rgba(168, 85, 247, 0)"
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400/60 via-blue-400/60 to-gray-300/40
                          dark:from-purple-400/40 dark:via-blue-400/40 dark:to-gray-600/40 rounded-full"></div>
        </motion.div>

        {/* Bot 图标（淡雅设计） */}
        <div className="relative group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/50
                          dark:from-gray-800/50 dark:to-gray-700/30
                          border border-gray-200/40 dark:border-gray-700/40
                          flex items-center justify-center shadow-md backdrop-blur-sm
                          group-hover:shadow-lg transition-all duration-300">
            <Bot className="w-6 h-6 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>

      {/* 🆕 修改后的文案设计 - 桌面端一行 */}
      <motion.div 
        className="space-y-1"
        initial={{ opacity: 0, y: 15 }}
        animate={{ 
          opacity: showDesktopCTA ? 1 : 0,
          y: showDesktopCTA ? 0 : 15,
          transition: { delay: 0.3, duration: 0.5 }
        }}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          共创新范式 · Rooted in Proof of Thought.
        </h2>
      </motion.div>

      {/* 🎯 升级版协调按钮设计 - 添加aigc-native-button类 */}
          <motion.button
            onClick={handleJoinPoT}
            className="relative px-12 py-4 
                      bg-white/80 dark:bg-gray-900/80 
                      border border-gray-200/60 dark:border-gray-700/60
                      text-gray-900 dark:text-gray-100 font-semibold text-base 
                      rounded-2xl backdrop-blur-xl overflow-hidden group 
                      transition-all duration-500 ease-out
                      hover:bg-white/90 dark:hover:bg-gray-900/90
                      hover:border-gray-300/70 dark:hover:border-gray-600/70
                      hover:shadow-xl hover:shadow-gray-900/10 dark:hover:shadow-black/20
                      hover:scale-[1.02] active:scale-[0.98]
                      focus:outline-none focus:ring-2 focus:ring-gray-400/30
                      aigc-native-button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, type: "spring", stiffness: 300 }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* 协调的背景渐变效果：默认可见，并根据模式改变颜色 */}
            <div className="absolute inset-0 bg-gradient-to-r 
                        from-gray-50/50 via-blue-50/30 to-gray-50/50
                        dark:from-gray-800/50 dark:via-purple-900/20 dark:to-gray-800/50
                        opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            
            {/* 微妙的霓虹边框：默认可见，并根据模式改变颜色 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent 
                        via-blue-400/20 to-transparent 
                        dark:via-purple-400/20 
                        opacity-100 transition-opacity duration-500 rounded-2xl 
                        border border-blue-400/30 dark:border-purple-400/30"></div>
            
            <span className="relative z-10">
              加入PoT.
            </span>
          </motion.button>
    </motion.div>
  ));


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
        title: ["学生AI使用全透明，", "教学超安心。"],
        description: "PoT(Proof of Thought)记录随任务捆绑提交，用好AI or 滥用AI？证据已到位，你说了算。",
        detailedDescription: "每次学生与AI的对话记录(PoT)记录都会完整保存并随作业一同提交。查看学生的思考过程、AI的引导轨迹，以及最终的成果输出。从问题到答案，整个协作链条一览无余，让您精准掌握学生的真实能力与AI依赖程度。",
        benefits: ["原始AI对话记录", "思维链条可视化", "学术诚信保障", "个性化指导依据"],
        placeholder: "AI使用记录截图占位符"
      },
      {
        icon: Brain,
        title: ["思维轨迹，", "一目了然。"],
        description: "定制PoT-Mode智能体引导学生思考，精准把握掌握程度，个性化指导更高效，教学更轻松。",
        detailedDescription: "PoT定制智能体善用「苏格拉底式教学法」，循循善诱地引导学生独立思考。不直接提供答案，总提供思维启发。通过分析学生的回答模式、思维深度和推理逻辑，生成个性化的思维能力画像*，帮您发现每位学生的认知特点与潜力。",
        benefits: ["苏格拉底式引导", "思维能力画像*", "认知特点分析*", "个性化教学建议*"],
        placeholder: "思维轨迹可视化截图占位符"
      },
      {
        icon: Zap,
        title: ["教学管理，", "简约而强大。"],
        description: "任务发布、班级管理、提交查阅，在手机上也能轻松完成。",
        detailedDescription: "一站式教师仪表盘设计，从任务创建到成果评阅，全流程移动适配。智能推荐任务模板*，批量管理多个班级，实时掌握提交进度。让繁琐的教务工作变得如iPhone般简约易用。",
        benefits: ["移动端100%适配", "智能任务模板*", "批量班级管理", "实时进度追踪"],
        placeholder: "教学管理界面截图占位符"
      }
    ],
    student: [
      {
        icon: Bot,
        title: ["PoT-Mode，", "启发不代替。"],
        description: "PoT(Proof of Thought)定制模型，个性化高效指导。所有任务，保质还保量。",
        detailedDescription: "专为学术思维训练设计的AI学习伙伴。它不会直接给出答案，而是通过精心定制的步骤，引导你自己解决问题。独属于你的24h学伴，帮你发现问题的本质，构建属于自己的知识框架，事半功倍。",
        benefits: ["启发式对话", "个性化引导", "思维能力提升", "学术诚信保障"],
        placeholder: "PoT对话界面截图占位符"
      },
      {
        icon: Shield,
        title: ["AI使用透明化，", "学术无忧。"],
        description: "记录AI协作全过程，展现真实思考轨迹。负责任的AI助力，提交作业更自信。",
        detailedDescription: "每一次AI协作都被完整记录，形成你的专属学习档案。向老师展示你的思考历程，AI赋能而非代替，体现你的学术诚信。在AI时代，透明度就是你的竞争优势。",
        benefits: ["完整协作记录", "学术诚信证明", "思考过程展示", "老师信任建立"],
        placeholder: "学术诚信记录截图占位符"
      },
      {
        icon: Layers,
        title:  ["开始你的思考，", "AI友情客串。"],
        description: "接入多种强力AIGC模型，移动端原生体验，学习无界限。",
        detailedDescription: "集成主流厂商最新顶级AI模型，尽情根据需求选择最适合的助手。无论是文本创作、数据分析还是创意设计，都能获得专业级的协助。移动端100%适配，随时随地开启深度学习。",
        benefits: ["多模型集成", "智能模型推荐*", "原生移动体验", "专业级协助"],
        placeholder: "多模态学习截图占位符"
      }
    ]
  };

  const currentFeatures = featuresData[role];
  const isTeacher = role === 'teacher';

  // 🎯 恢复正确的页面入场动画逻辑
  useEffect(() => {
    const runEntranceAnimation = async () => {
      // 页面整体淡入
      await pageControls.start({
        opacity: 1,
        transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
      });

      // 标题区域动画
      await headerControls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
      });

      // 卡片区域动画
      await cardsControls.start({
        opacity: 1,
        y: 0,
        transition: { 
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
          staggerChildren: 0.2
        }
      });

      // 桌面端CTA延迟显示（恢复原逻辑）
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
            {Array.isArray(feature.title) 
              ? feature.title.map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < feature.title.length - 1 && <br />}
                  </span>
                ))
              : feature.title
            }
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
              {Array.isArray(feature.title) 
                ? feature.title.map((line, index) => (
                    <span key={index}>
                      {line}
                      {index < feature.title.length - 1 && <br />}
                    </span>
                  ))
                : feature.title
              }
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
              className="w-11 h-11 rounded-3xl bg-transparent hover:bg-gray-100/80 
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
              className="w-11 h-11 rounded-3xl bg-transparent hover:bg-gray-100/80 
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
                  ? 'inset-x-4 bottom-10 top-20' 
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
                    {Array.isArray(feature.title) 
                      ? feature.title.map((line, index) => (
                          <span key={index}>
                            {line}
                            {index < feature.title.length - 1 && <br />}
                          </span>
                        ))
                      : feature.title
                    }
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

                  {/* 配图区域占位符
                  <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {feature.placeholder}
                    </p>
                  </div> */}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };


  // 🎯 重构后的移动端CTA组件 - 人机合作主题（修正版）
  const MobileFinalCTA = () => (
    <AnimatePresence>
      {showFinalCTA && (
        <motion.div
          className="text-center space-y-6 px-4"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {/* 🆕 AI + Brain 连接动画图标（淡雅色调） */}
          <motion.div 
            className="flex items-center justify-center space-x-4 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Brain 图标 */}
            <motion.div
              className="relative"
              initial={{ x: -15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50
                              dark:from-gray-800/50 dark:to-gray-700/50 
                              border border-gray-200/30 dark:border-gray-700/30
                              flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Brain className="w-7 h-7 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* 连接线动画（霓虹效果） */}
            <motion.div
              className="flex items-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <motion.div
                className="w-6 h-px bg-gradient-to-r from-gray-300/60 via-blue-400/80 to-purple-400/80
                          dark:from-gray-600/60 dark:via-blue-400/60 dark:to-purple-400/60"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                style={{ originX: 0 }}
              />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 mx-1 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, duration: 0.3 }}
                style={{
                  boxShadow: "0 0 8px rgba(168, 85, 247, 0.4)"
                }}
              />
              <motion.div
                className="w-6 h-px bg-gradient-to-r from-purple-400/80 via-blue-400/80 to-gray-300/60
                          dark:from-purple-400/60 dark:via-blue-400/60 dark:to-gray-600/60"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                style={{ originX: 1 }}
              />
            </motion.div>

            {/* Bot 图标 */}
            <motion.div
              className="relative"
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6, type: "spring" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50
                              dark:from-gray-800/50 dark:to-gray-700/50
                              border border-gray-200/30 dark:border-gray-700/30
                              flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Bot className="w-7 h-7 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
              </div>
            </motion.div>
          </motion.div>

          {/* 🆕 修改后的对话式文案 - 移动端两行 */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              共创新范式。
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Rooted in Proof of Thought.
            </p>
          </motion.div>

          <motion.button
            onClick={handleJoinPoT}
            className="relative px-12 py-4 
                      bg-white/80 dark:bg-gray-900/80 
                      border border-gray-200/60 dark:border-gray-700/60
                      text-gray-900 dark:text-gray-100 font-semibold text-base 
                      rounded-2xl backdrop-blur-xl overflow-hidden group 
                      transition-all duration-500 ease-out
                      hover:bg-white/90 dark:hover:bg-gray-900/90
                      hover:border-gray-300/70 dark:hover:border-gray-600/70
                      hover:shadow-xl hover:shadow-gray-900/10 dark:hover:shadow-black/20
                      hover:scale-[1.02] active:scale-[0.98]
                      focus:outline-none focus:ring-2 focus:ring-gray-400/30
                      aigc-native-button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, type: "spring", stiffness: 300 }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* 协调的背景渐变效果：默认可见，并根据模式改变颜色 */}
            <div className="absolute inset-0 bg-gradient-to-r 
                        from-gray-50/50 via-blue-50/30 to-gray-50/50
                        dark:from-gray-800/50 dark:via-purple-900/20 dark:to-gray-800/50
                        opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            
            {/* 微妙的霓虹边框：默认可见，并根据模式改变颜色 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent 
                        via-blue-400/20 to-transparent 
                        dark:via-purple-400/20 
                        opacity-100 transition-opacity duration-500 rounded-2xl 
                        border border-blue-400/30 dark:border-purple-400/30"></div>
            
            <span className="relative z-10">
              加入PoT.
            </span>
          </motion.button>

          {/* 🆕 微妙的装饰元素（淡化） */}
          <motion.div
            className="absolute -top-8 -right-8 w-16 h-16 rounded-full 
                      bg-gradient-to-br from-gray-100/20 to-blue-100/20
                      dark:from-gray-800/20 dark:to-blue-800/20 blur-2xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 overflow-hidden fixed inset-0">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
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
                  <div className="relative bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 
                                  shadow-xl shadow-gray-900/5 dark:shadow-black/20
                                  border border-gray-200/40 dark:border-gray-700/40
                                  h-[400px] flex flex-col items-center justify-center
                                  overflow-hidden">
                    {/* 淡雅背景装饰 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-50/30 to-gray-100/20
                                    dark:from-transparent dark:via-gray-800/20 dark:to-gray-700/10 pointer-events-none"></div>
                    <div className="relative z-10 w-full">
                      <MobileFinalCTA />
                    </div>
                  </div>
                </SwiperSlide>
                </Swiper>
              </motion.div>

              {/* 🆕 Apple风格滑动控制按钮 */}
              <AppleStyleNavigation />
            </div>
          )}

          {/* 桌面端CTA - 预留空间避免布局跳动 */}
          {!isMobile && (
            <div className="w-full flex items-center justify-center mt-8 min-h-[100px]">
              <DesktopFinalCTA 
                showDesktopCTA={showDesktopCTA} 
                handleJoinPoT={handleJoinPoT} 
              />
            </div>
          )}
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