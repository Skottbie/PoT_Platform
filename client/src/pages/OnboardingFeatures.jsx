// client/src/pages/OnboardingFeatures.jsx - Apple风格优化版
import { useState, useEffect, useCallback, useRef } from 'react';
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
  X,
  Sparkles,
  Star,
  ArrowRight
} from 'lucide-react';

const OnboardingFeatures = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role = 'teacher' } = location.state || {};
  
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinalCTA, setShowFinalCTA] = useState(false);
  const [showDesktopCTA, setShowDesktopCTA] = useState(false);
  
  // 模态框相关状态
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // 优化后的移动端滑动状态
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);

  const pageControls = useAnimation();
  const headerControls = useAnimation();
  const cardsControls = useAnimation();
  const containerRef = useRef(null);

  // 响应式检测
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 移动端禁用页面滚动
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [isMobile]);

  // 增强的功能数据配置 - Apple风格内容
  const featuresData = {
    teacher: [
      {
        icon: Search,
        title: "学生AI使用全透明",
        subtitle: "教学超安心",
        description: "AI交互原始记录随任务捆绑提交，用好AI or 滥用AI？证据已到位，决定权在你。",
        features: ["完整对话记录", "时间戳追踪", "使用频率分析"],
        color: "blue",
        gradient: "from-blue-500 to-cyan-500"
      },
      {
        icon: Brain,
        title: "思维轨迹可视化",
        subtitle: "一目了然",
        description: "定制PoT-Mode智能体引导学生思考，精准把握掌握程度，个性化指导更高效。",
        features: ["思维导图生成", "知识点覆盖率", "个性化建议"],
        color: "purple",
        gradient: "from-purple-500 to-pink-500"
      },
      {
        icon: Zap,
        title: "教学管理",
        subtitle: "简约而强大",
        description: "任务发布、班级管理、提交查阅，在手机上也能轻松完成所有教学工作。",
        features: ["一键发布", "实时通知", "数据统计"],
        color: "green",
        gradient: "from-green-500 to-emerald-500"
      }
    ],
    student: [
      {
        icon: Bot,
        title: "PoT-Mode",
        subtitle: "启发不代替",
        description: "PoT定制模型提供个性化高效指导，帮你高质量完成所有学习任务。",
        features: ["智能引导", "循序渐进", "深度思考"],
        color: "indigo",
        gradient: "from-indigo-500 to-blue-500"
      },
      {
        icon: Shield,
        title: "AI使用透明化",
        subtitle: "学术无忧",
        description: "记录AI协作全过程，展现真实思考轨迹。负责任地使用AI，提交作业更自信。",
        features: ["诚信保障", "过程透明", "能力证明"],
        color: "amber",
        gradient: "from-amber-500 to-orange-500"
      },
      {
        icon: Layers,
        title: "多模态学习",
        subtitle: "无界思考",
        description: "接入多种强力AIGC模型，移动端原生体验，随时随地开启学习之旅。",
        features: ["多模型选择", "移动端优化", "离线支持"],
        color: "rose",
        gradient: "from-rose-500 to-pink-500"
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

  // 优化的移动端滑动处理
  const handleTouchStart = useCallback((e) => {
    const touch = e.targetTouches[0];
    setTouchStart(touch.clientX);
    setTouchStartTime(Date.now());
    setIsSliding(false);
    setSlideOffset(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart) return;
    
    const touch = e.targetTouches[0];
    const currentTouch = touch.clientX;
    const diff = touchStart - currentTouch;
    
    // 检测是否为滑动
    if (Math.abs(diff) > 10) {
      setIsSliding(true);
      e.preventDefault(); // 防止垂直滚动
    }
    
    setTouchEnd(currentTouch);
    setSlideOffset(-diff); // 实时滑动效果
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) {
      setSlideOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const duration = Date.now() - touchStartTime;
    const velocity = Math.abs(distance) / duration;
    
    // 优化的滑动检测：降低阈值，增加速度判断
    const minSwipeDistance = 30;
    const minSwipeVelocity = 0.3;
    
    if (Math.abs(distance) > minSwipeDistance || velocity > minSwipeVelocity) {
      if (distance > 0 && currentIndex < currentFeatures.length) {
        // 左滑 - 下一页
        handleNext();
      } else if (distance < 0 && currentIndex > 0) {
        // 右滑 - 上一页
        handlePrev();
      }
    }
    
    // 重置状态
    setSlideOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
    setIsSliding(false);
  }, [touchStart, touchEnd, touchStartTime, currentIndex, currentFeatures.length]);

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

  // 优化的卡片点击处理 - 解决点击不灵敏问题
  const handleCardClick = useCallback((feature, e) => {
    // 如果正在滑动，不触发点击
    if (isSliding) {
      e?.preventDefault();
      return;
    }
    
    // 触觉反馈（如果支持）
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
    
    setSelectedFeature(feature);
    setShowModal(true);
  }, [isSliding]);

  // 模态框关闭处理
  const closeModal = useCallback(() => {
    setShowModal(false);
    setTimeout(() => setSelectedFeature(null), 300);
  }, []);

  // CTA点击处理
  const handleJoinPoT = useCallback(() => {
    navigate('/login', {
      state: { role, from: 'features' },
      replace: false
    });
  }, [navigate, role]);

  // Apple风格功能卡片组件 - 长矩形设计
  const FeatureCard = ({ feature, index, onClick }) => {
    const IconComponent = feature.icon;
    
    return (
      <motion.div
        className="relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden
                   shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.08),0_12px_24px_rgba(0,0,0,0.08)]
                   dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3),0_12px_24px_rgba(0,0,0,0.3)]
                   hover:shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_4px_8px_rgba(0,0,0,0.1),0_20px_30px_rgba(0,0,0,0.1)]
                   transition-all duration-500 cursor-pointer group"
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
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 渐变背景装饰 */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 dark:opacity-10`} />
        
        {/* 内容区域 */}
        <div className="relative p-8">
          {/* 图标和标题区域 */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} 
                            flex items-center justify-center shadow-lg`}>
                <IconComponent className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {feature.subtitle}
                </p>
              </div>
            </div>
            
            {/* 右上角装饰 */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Sparkles className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            </div>
          </div>

          {/* 描述文本 */}
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {feature.description}
          </p>

          {/* 特性标签 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {feature.features.map((item, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 
                                     text-xs text-gray-600 dark:text-gray-400 
                                     rounded-full">
                {item}
              </span>
            ))}
          </div>

          {/* 底部操作提示 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              点击了解更多
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 
                          flex items-center justify-center group-hover:bg-gray-200 
                          dark:group-hover:bg-gray-700 transition-colors">
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // 移动端卡片组件 - Apple风格优化
  const MobileFeatureCard = ({ feature, onClick }) => {
    const IconComponent = feature.icon;
    const [touchStartPos, setTouchStartPos] = useState(0);
    const [touchStartTime, setTouchStartTime] = useState(0);
    
    const handleTouchStart = (e) => {
      setTouchStartPos(e.touches[0].clientX);
      setTouchStartTime(Date.now());
    };
    
    const handleTouchEnd = (e) => {
      const touchEndPos = e.changedTouches[0].clientX;
      const touchDuration = Date.now() - touchStartTime;
      const touchDistance = Math.abs(touchEndPos - touchStartPos);
      
      // 只有短时间内小范围移动才算点击
      if (touchDuration < 300 && touchDistance < 10) {
        onClick(feature);
      }
    };
    
    return (
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl
                   shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]
                   min-h-[240px] relative overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 渐变背景 */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 dark:opacity-10`} />
        
        {/* 内容 */}
        <div className="relative p-6 h-full flex flex-col">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} 
                          flex items-center justify-center shadow-md`}>
              <IconComponent className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <Star className="w-4 h-4 text-gray-300 dark:text-gray-700" />
          </div>

          {/* 标题和副标题 */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {feature.subtitle}
            </p>
          </div>

          {/* 描述 */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">
            {feature.description}
          </p>

          {/* 底部提示 */}
          <div className="flex items-center justify-end mt-4">
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">
              轻触查看
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    );
  };

  // 功能详情模态框组件
  const FeatureModal = ({ feature, isOpen, onClose, isMobile }) => {
    if (!feature) return null;
    
    const IconComponent = feature.icon;

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
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
                stiffness: 300
              }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-3xl 
                            shadow-2xl h-full overflow-hidden flex flex-col">
                
                {/* 模态框头部 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} 
                                  flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {feature.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {feature.subtitle}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 
                             hover:bg-gray-200 dark:hover:bg-gray-700
                             flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                  </button>
                </div>

                {/* 模态框内容 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* 功能描述 */}
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* 特性列表 */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      核心特性
                    </h3>
                    <div className="space-y-2">
                      {feature.features.map((item, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 
                                              bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 配图占位区域 */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 
                                dark:from-gray-800 dark:to-gray-700 
                                rounded-2xl h-48 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      功能演示图
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
          Proof of Thought
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          共创AI学习新范式
        </p>
      </motion.div>

      <motion.button
        onClick={handleJoinPoT}
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold 
                   rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                   hover:scale-[1.05] active:scale-[0.98]
                   focus:outline-none focus:ring-4 focus:ring-blue-500/50
                   min-w-[160px]"
        whileTap={{ scale: 0.95 }}
      >
        加入 PoT
      </motion.button>
    </motion.div>
  );

  // 桌面端CTA组件
  const DesktopFinalCTA = () => (
    <AnimatePresence>
      {showDesktopCTA && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Proof of Thought
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              共创AI学习新范式
            </p>
          </motion.div>

          <motion.button
            onClick={handleJoinPoT}
            className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 
                     text-white font-semibold text-lg rounded-3xl 
                     shadow-xl hover:shadow-2xl transition-all duration-300
                     hover:scale-[1.05] active:scale-[0.98]
                     focus:outline-none focus:ring-4 focus:ring-blue-500/50
                     relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10">加入 PoT Academy</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br 
                    from-gray-50 via-white to-gray-50 
                    dark:from-gray-950 dark:via-gray-900 dark:to-gray-950
                    ${isMobile ? 'overflow-hidden' : ''}`}
         style={{ touchAction: isMobile ? 'pan-x' : 'auto' }}>
      <motion.div
        ref={containerRef}
        className="w-full max-w-7xl mx-auto px-6 py-12"
        initial={{ opacity: 0 }}
        animate={pageControls}
      >
        {/* 页面标题 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={headerControls}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {isTeacher ? '教学' : '学习'}新范式，了解一下
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            探索 PoT Academy 的核心功能
          </p>
        </motion.div>

        {/* 桌面端：网格卡片布局 */}
        {!isMobile && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
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
                  staggerChildren: 0.15
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

        {/* 移动端：优化的滑动卡片 */}
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
                  transform: `translateX(calc(-${currentIndex * (100 / (currentFeatures.length + 1))}% + ${slideOffset}px))`,
                  width: `${(currentFeatures.length + 1) * 100}%`
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* 功能卡片 */}
                {currentFeatures.map((feature, index) => (
                  <div key={index} style={{ width: `${100 / (currentFeatures.length + 1)}%` }} className="flex-shrink-0 px-3">
                    <MobileFeatureCard feature={feature} onClick={handleCardClick} />
                  </div>
                ))}
                
                {/* CTA卡片 */}
                <div style={{ width: `${100 / (currentFeatures.length + 1)}%` }} className="flex-shrink-0 px-3">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl
                                shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]
                                flex flex-col items-center justify-center min-h-[240px]">
                    <MobileFinalCTA />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Apple风格分离式控制按钮 */}
            <div className="flex justify-center items-center mt-6 space-x-3">
              {/* 上一页按钮 */}
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-11 h-11 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl
                         shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
                         flex items-center justify-center transition-all duration-200
                         disabled:opacity-30 disabled:cursor-not-allowed
                         hover:bg-white dark:hover:bg-gray-700
                         hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]
                         active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </button>

              {/* 页面指示器 */}
              <div className="flex items-center space-x-1.5 px-3">
                {[...Array(currentFeatures.length + 1)].map((_, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-300 rounded-full
                              ${currentIndex === index 
                                ? 'w-7 h-2 bg-gray-900 dark:bg-white' 
                                : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'}`}
                  />
                ))}
              </div>

              {/* 下一页按钮 */}
              <button
                onClick={handleNext}
                disabled={currentIndex >= currentFeatures.length}
                className="w-11 h-11 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl
                         shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
                         flex items-center justify-center transition-all duration-200
                         disabled:opacity-30 disabled:cursor-not-allowed
                         hover:bg-white dark:hover:bg-gray-700
                         hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]
                         active:scale-95"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* 桌面端CTA */}
        <DesktopFinalCTA />
      </motion.div>

      {/* 功能详情模态框 */}
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