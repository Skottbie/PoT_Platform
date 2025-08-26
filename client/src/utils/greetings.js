// client/src/utils/greetings.js 

/**
 * effortlessly sophisticated
 */
export const GREETINGS_CONFIG = {
  teacher: {
    // 06:00-09:00 早晨 - 新的开始
    morning: [
      "Good morning, ",
      "早安，",
      "Morning, ",
      "新的一天，", 
      "Fresh start, ",
      "早晨好，",
      "Ready? ",
      "Another day, ",
      "清晨好，",
      "Here we go, ",
      "新的开始，",
      "Morning vibes, "
    ],
    
    // 09:00-12:00 上午 - 工作黄金时间
    forenoon: [
      "Hello there, ",
      "上午好，",
      "Welcome back, ",
      "又见面了，",
      "Ready to inspire? ",
      "Good to see you, ",
      "工作日开始，",
      "Let's create, ",
      "Time to shine, ",
      "Here you are, ",
      "美好的上午，",
      "Making a difference, "
    ],
    
    // 12:00-14:00 午间 - 休息时光
    noon: [
      "Lunch time, ",
      "午间好，",
      "Time for a break, ",
      "休息一下吧，",
      "Midday pause, ",
      "午休时间，",
      "Recharge time, ",
      "Take a moment, ",
      "中午好，",
      "Breathe, ",
      "放松一下，",
      "Noon break, "
    ],
    
    // 14:00-18:00 下午 - 持续创造
    afternoon: [
      "Afternoon, ",
      "下午好，",
      "Back to it, ",
      "继续前进，",
      "Second half, ",
      "午后时光，",
      "Keep going, ",
      "阳光正好，",
      "Productive hours, ",
      "Let's continue, ",
      "下午的工作，",
      "Steady progress, "
    ],
    
    // 18:00-22:00 晚间 - 总结反思
    evening: [
      "Evening, ",
      "晚上好，",
      "End of day, ",
      "一天辛苦了，",
      "Winding down, ",
      "夜幕降临，",
      "Time to reflect, ",
      "晚间时光，",
      "Almost done, ",
      "Evening thoughts, ",
      "今天如何？",
      "Quiet hours, "
    ],
    
    // 22:00-06:00 深夜 - 关怀提醒  
    lateNight: [
      "Working late? ",
      "还在忙碌？",
      "Take care, ",
      "早些休息，",
      "Night owl, ",
      "深夜了，",
      "Don't overdo it, ",
      "记得休息，",
      "Late hours, ",
      "Easy does it, ",
      "夜深了哦，",
      "Rest soon, "
    ],
    
    // 通用问候语 - 随时适用
    universal: [
      "Welcome back, ",
      "Hi there, ",
      "欢迎回来，",
      "Good to see you, ",
      "Here again, ",
      "Always here, ",
      "Ready when you are, ",
      "看看这是谁，",
      "At your service, ",
      "Let's work, ",
      "您好，"
    ]
  },
  
  student: {
    // 06:00-09:00 早晨 - 充满活力
    morning: [
      "Good morning!",
      "早上好早上坏，",
      "Morning energy! ",
      "新的一天开始啦，",
      "Rise and shine, ",
      "起这么早吗？",
      "Fresh vibes, ",
      "晨光初现，",
      "Ready to learn? ",
      "Morning magic, ",
      "开启新的一天，",
      "Bright and early, ",
      "这么努力吗我的朋友，"
    ],
    
    // 09:00-12:00 上午 - 学习模式
    forenoon: [
      "Hey there! ",
      "上午好，",
      "Ready to explore? ",
      "今天必须给他学个明白，",
      "Let's dive in, ",
      "努力学习这一块，",
      "Morning momentum, ",
      "又见面了，",
      "Time to grow, ",
      "Focus time, ",
      "准备好了吗？",
      "Learning awaits, ",
      "用功这一块，"
    ],
    
    // 12:00-14:00 午间 - 放松充电
    noon: [
      "Lunch break! ",
      "午饭时间，",
      "Time to refuel, ",
      "中午吃了什么？",
      "Midday pause, ",
      "中午好，",
      "Recharge mode, ",
      "主打一个用功，",
      "Take a break, ",
      "Noon vibes, ",
      "放松时刻，",
      "Energy boost, "
    ],
    
    // 14:00-18:00 下午 - 继续努力
    afternoon: [
      "Afternoon power! ",
      "下午继续加油，",
      "Keep the momentum, ",
      "午后犯困了吗，",
      "Second wind, ",
      "用功这一块，",
      "Afternoon flow, ",
      "Stay strong, ",
      "Push through, ",
      "一天又过半了，",
      "Almost there, "
    ],
    
    // 18:00-22:00 晚间 - 夜晚学习
    evening: [
      "Evening study!",
      "晚上好，",
      "Night session? ",
      "努力学习这一块，",
      "Evening vibes, ",
      "晚间时光，",
      "Study night? ",
      "今晚要熬夜吗？",
      "Quiet focus, ",
      "Evening energy, ",
      "After hours, "
    ],
    
    // 22:00-06:00 深夜 - 温暖关怀
    lateNight: [
      "Still here?",
      "这么晚还在学习？",
      "Night warrior, ",
      "熬夜冠军，",
      "Late night grind, ",
      "夜深了哦，",
      "Coffee time?",
      "早点睡吧朋友，",
      "Midnight oil, ",
      "Take it easy, ",
      "记得休息哦，",
      "Dream soon, ",
      "狠狠地努力，"
    ],
    
    // 通用问候语 - 活泼有趣
    universal: [
      "Welcome back! ",
      "看看谁来了，",
      "Hi there! ",
      "又见面了朋友，",
      "Ready? ",
      "Here we go! ",
      "欢迎回家，",
      "Let's do this, ",
      "包努力的朋友，",
      "Always here, "
    ]
  }
};

/**
 * 获取当前时间段 - 优化时间分割
 */
export const getTimeSlot = () => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 9) return 'morning';      // 06:00-08:59 早晨
  if (hour >= 9 && hour < 12) return 'forenoon';    // 09:00-11:59 上午  
  if (hour >= 12 && hour < 14) return 'noon';       // 12:00-13:59 午间
  if (hour >= 14 && hour < 18) return 'afternoon';  // 14:00-17:59 下午
  if (hour >= 18 && hour < 22) return 'evening';    // 18:00-21:59 晚间
  return 'lateNight';                                // 22:00-05:59 深夜
};

/**
 * 获取时间段的优雅描述
 */
export const getTimeSlotDescription = () => {
  const timeSlot = getTimeSlot();
  const descriptions = {
    morning: 'Morning (06:00-08:59)',
    forenoon: 'Forenoon (09:00-11:59)', 
    noon: 'Noon (12:00-13:59)',
    afternoon: 'Afternoon (14:00-17:59)',
    evening: 'Evening (18:00-21:59)',
    lateNight: 'Late Night (22:00-05:59)'
  };
  return descriptions[timeSlot];
};

/**
 * 设计理念：Thoughtful, personal, effortlessly sophisticated
 */
export const getGreeting = (userRole, userNickname, userEmail) => {
  // 参数验证
  if (!userRole || !['teacher', 'student'].includes(userRole)) {
    console.warn('🍎 Invalid userRole:', userRole);
    return 'Welcome back';
  }
  
  if (!userEmail) {
    console.warn('🍎 Missing userEmail');
    return 'Welcome back';
  }
  
  const timeSlot = getTimeSlot();
  const config = GREETINGS_CONFIG[userRole];
  
  // 概率分布：85% 时间段问候，15% 通用问候
  const useUniversal = Math.random() < 0.15;
  const greetings = useUniversal ? config.universal : config[timeSlot];
  
  // 随机选择
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  // 智能显示名称：昵称优先，否则使用邮箱前缀
  const displayName = userNickname || userEmail.split('@')[0];
  
  return `${randomGreeting}${displayName}`;
};

/**
 * 获取问候语统计信息
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
    currentTimeSlotDescription: getTimeSlotDescription(),
    appleStyle: true 
  };
};

/**
 * 生成多样化示例问候语（质量测试）
 */
export const generateSampleGreetings = (userRole, userNickname, userEmail, count = 8) => {
  const samples = [];
  for (let i = 0; i < count; i++) {
    samples.push(getGreeting(userRole, userNickname, userEmail));
  }
  return [...new Set(samples)]; // 去重，确保多样性
};

//  开发环境
if (process.env.NODE_ENV === 'development') {
  // 挂载到 window 对象
  window.appleGreetings = {
    getGreeting,
    getTimeSlot, 
    getTimeSlotDescription,
    getGreetingStats,
    generateSampleGreetings,
    GREETINGS_CONFIG,
    version: '2.0-Apple-Style'
  };
  
  console.log('📝 当前时段:', getTimeSlotDescription());
  console.log('🔍 调试工具: window.appleGreetings');
}