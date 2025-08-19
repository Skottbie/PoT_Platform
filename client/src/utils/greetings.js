// client/src/utils/greetings.js - 智能欢迎词系统

/**
 * 欢迎词配置
 */
export const GREETINGS_CONFIG = {
  teacher: {
    // 05:00-07:59 早晨
    earlyMorning: [
      "早安，", "清晨好，", "新的一天开始了，", "晨光初现，"
    ],
    // 08:00-11:59 上午
    morning: [
      "上午好，", "美好的上午，", "工作日开始了，", "看看这是谁来了，"
    ],
    // 12:00-13:59 午间
    noon: [
      "午间好，", "午休时间，", "用餐愉快，", "中午好，"
    ],
    // 14:00-17:59 下午
    afternoon: [
      "下午好，", "午后时光，", "阳光正好，", "下午的工作开始了，"
    ],
    // 18:00-21:59 晚上
    evening: [
      "晚上好，", "夜幕降临，", "辛苦一天了，", "晚间时光，"
    ],
    // 22:00-04:59 深夜
    lateNight: [
      "深夜了，", "还在工作吗？", "咖啡喝多了吗？", "记得早点休息，", "夜深了，"
    ],
    // 通用问候语（随机穿插）
    universal: [
      "看看这是谁回来了，", "又见面了，", "欢迎回来，", "您好，"
    ]
  },
  
  student: {
    // 05:00-07:59 早晨
    earlyMorning: [
      "早鸭！", "这么早就起床了？", "晨练回来了吗，", "早起的鸟儿，"
    ],
    // 08:00-11:59 上午  
    morning: [
      "上午好呀，", "起这么早吗我的朋友，", "新的一天开始战斗了，", "精神满满的样子，"
    ],
    // 12:00-13:59 午间
    noon: [
      "午饭吃了吗？", "午休时间到，", "中午好鸭，", "该补充能量了，"
    ],
    // 14:00-17:59 下午
    afternoon: [
      "下午也要加油哦，", "午后犯困了吗？", "这么努力吗我的朋友，", "下午茶时间，"
    ],
    // 18:00-21:59 晚上
    evening: [
      "晚上好呀，", "夜猫子上线了，", "今晚又要熬夜学习吗？", "晚餐时间到，"
    ],
    // 22:00-04:59 深夜
    lateNight: [
      "这么晚还在学习？", "夜深了哦，", "咖啡续命中...", "熬夜冠军，", "早点睡吧朋友，"
    ],
    // 通用问候语（更活泼）
    universal: [
      "看看这是谁回来了，", "哎呀！", "又是你！", "欢迎回家，", "嗨！"
    ]
  }
};

/**
 * 获取当前时间段
 * @returns {string} 时间段标识
 */
export const getTimeSlot = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 8) return 'earlyMorning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'lateNight'; // 22:00-04:59
};

/**
 * 获取时间段的中文描述（用于调试）
 * @returns {string} 时间段描述
 */
export const getTimeSlotDescription = () => {
  const timeSlot = getTimeSlot();
  const descriptions = {
    earlyMorning: '清晨 (05:00-07:59)',
    morning: '上午 (08:00-11:59)',
    noon: '午间 (12:00-13:59)',
    afternoon: '下午 (14:00-17:59)',
    evening: '晚上 (18:00-21:59)',
    lateNight: '深夜 (22:00-04:59)'
  };
  return descriptions[timeSlot];
};

/**
 * 智能欢迎词生成
 * @param {string} userRole - 用户角色 ('teacher' | 'student')
 * @param {string|null} userNickname - 用户昵称
 * @param {string} userEmail - 用户邮箱
 * @returns {string} 生成的欢迎词
 */
export const getGreeting = (userRole, userNickname, userEmail) => {
  // 参数验证
  if (!userRole || !['teacher', 'student'].includes(userRole)) {
    console.warn('Invalid userRole:', userRole);
    return '欢迎回来';
  }
  
  if (!userEmail) {
    console.warn('Missing userEmail');
    return '欢迎回来';
  }
  
  const timeSlot = getTimeSlot();
  const config = GREETINGS_CONFIG[userRole];
  
  // 80%概率使用时间段问候语，20%概率使用通用问候语
  const useUniversal = Math.random() < 0.2;
  const greetings = useUniversal ? config.universal : config[timeSlot];
  
  // 随机选择一个问候语
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  // 获取显示名称：昵称 > 邮箱前缀
  const displayName = userNickname || userEmail.split('@')[0];
  
  return `${randomGreeting}${displayName}`;
};

/**
 * 获取问候语统计信息（用于调试）
 * @param {string} userRole - 用户角色
 * @returns {object} 统计信息
 */
export const getGreetingStats = (userRole) => {
  if (!GREETINGS_CONFIG[userRole]) return null;
  
  const config = GREETINGS_CONFIG[userRole];
  const stats = {};
  
  Object.keys(config).forEach(timeSlot => {
    stats[timeSlot] = config[timeSlot].length;
  });
  
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  
  return {
    timeSlots: stats,
    total,
    currentTimeSlot: getTimeSlot(),
    currentTimeSlotDescription: getTimeSlotDescription()
  };
};

/**
 * 生成多个示例问候语（用于测试）
 * @param {string} userRole - 用户角色
 * @param {string|null} userNickname - 用户昵称
 * @param {string} userEmail - 用户邮箱
 * @param {number} count - 生成数量
 * @returns {Array} 问候语数组
 */
export const generateSampleGreetings = (userRole, userNickname, userEmail, count = 5) => {
  const samples = [];
  for (let i = 0; i < count; i++) {
    samples.push(getGreeting(userRole, userNickname, userEmail));
  }
  return samples;
};

// 🎯 开发环境下的调试工具
if (process.env.NODE_ENV === 'development') {
  // 将工具函数挂载到 window 对象，方便调试
  window.greetingUtils = {
    getGreeting,
    getTimeSlot,
    getTimeSlotDescription,
    getGreetingStats,
    generateSampleGreetings,
    GREETINGS_CONFIG
  };
  
  console.log('🎭 欢迎词系统已加载，可使用 window.greetingUtils 进行调试');
  console.log('📝 当前时间段:', getTimeSlotDescription());
}