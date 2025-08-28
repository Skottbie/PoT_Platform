// client/src/contexts/SandboxContext.jsx
// 🎯 沙盒模式状态管理 - 完全独立，不影响现有功能

import { createContext, useContext, useEffect, useState } from 'react';

const SandboxContext = createContext();

export const useSandbox = () => {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error('useSandbox must be used within a SandboxProvider');
  }
  return context;
};

// 🎭 示例数据定义 - 完全符合现有数据模型
const DEMO_DATA = {
  // 示例班级数据（1个班级，5个学生）
  classes: [{
    _id: 'demo-class-1',
    name: '2024秋季-计算思维导论',
    description: '探索计算思维的基本概念和方法',
    teacherId: 'demo-teacher-1',
    inviteCode: 'DEMO2024',
    studentList: [
      {
        name: '张晓明',
        studentId: '2024001001',
        userId: 'demo-student-1',
        joinedAt: new Date('2024-09-15')
      },
      {
        name: '李思雨', 
        studentId: '2024001002',
        userId: 'demo-student-2',
        joinedAt: new Date('2024-09-15')
      },
      {
        name: '王志豪',
        studentId: '2024001003', 
        userId: 'demo-student-3',
        joinedAt: new Date('2024-09-16')
      },
      {
        name: '陈欣怡',
        studentId: '2024001004',
        userId: 'demo-student-4', 
        joinedAt: new Date('2024-09-16')
      },
      {
        name: '刘宇航',
        studentId: '2024001005',
        userId: 'demo-student-5',
        joinedAt: new Date('2024-09-17')
      }
    ],
    createdAt: new Date('2024-09-15')
  }],

  // 示例任务数据（3个任务：已截止+即将截止+进行中）
  tasks: [
    // 1. 已截止任务
    {
      _id: 'demo-task-1',
      title: '探讨人工智能对教育的影响',
      description: '请结合具体案例，分析AI技术如何改变传统教学模式，并讨论可能带来的机遇与挑战。要求：1500字以上，需要引用至少3个权威资料。',
      category: '课程任务',
      needsFile: true,
      allowAIGC: true,
      requireAIGCLog: true,
      deadline: new Date('2024-11-20T23:59:00'), // 已截止
      allowLateSubmission: true,
      createdBy: 'demo-teacher-1',
      classIds: ['demo-class-1'],
      createdAt: new Date('2024-11-10'),
      isArchived: false
    },
    // 2. 即将截止任务  
    {
      _id: 'demo-task-2',
      title: '设计可持续发展解决方案',
      description: '针对校园环境保护问题，设计一个可行的解决方案。可以从节能减排、垃圾分类、绿色出行等角度展开。',
      category: '课程任务', 
      needsFile: false,
      allowAIGC: true,
      requireAIGCLog: false,
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后截止
      allowLateSubmission: false,
      createdBy: 'demo-teacher-1', 
      classIds: ['demo-class-1'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前创建
      isArchived: false
    },
    // 3. 进行中任务
    {
      _id: 'demo-task-3',
      title: '分析《论语》中的教育思想',
      description: '选择《论语》中的3-5句关于教育的名言，分析其现代意义并结合个人学习体验进行思考。',
      category: '课堂练习',
      needsFile: false, 
      allowAIGC: false,
      requireAIGCLog: false,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后截止
      allowLateSubmission: true,
      createdBy: 'demo-teacher-1',
      classIds: ['demo-class-1'], 
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前创建
      isArchived: false
    }
  ],

  // 示例AIGC对话记录
  aigcLogs: {
    // 张晓明的PoT模式对话（简化版）
    'demo-aigc-log-1': [
      {
        role: 'user',
        content: '老师要求我们分析AI对教育的影响，我应该从哪些角度来思考这个问题？',
        model: 'pot-tutor',
        timestamp: 1700380200000,
        potMode: true
      },
      {
        role: 'assistant', 
        content: '这是一个很好的研究方向！你觉得AI对教育的影响可能体现在哪几个层面呢？比如从教学方式、学习效果等角度，你能想到哪些具体变化？',
        model: 'pot-tutor',
        timestamp: 1700380220000,
        potMode: true
      },
      {
        role: 'user',
        content: '我想到了个性化学习、智能评估，还有在线教育的普及。',
        model: 'pot-tutor', 
        timestamp: 1700380300000,
        potMode: true
      },
      {
        role: 'assistant',
        content: '很好的观察！对于个性化学习，你能举一个具体的例子说明AI是如何实现的吗？',
        model: 'pot-tutor',
        timestamp: 1700380320000, 
        potMode: true
      },
      // 切换到普通模式查询数据
      {
        role: 'user',
        content: '帮我查一下AI教育的最新统计数据',
        model: 'qwen-flash',
        timestamp: 1700380400000,
        potMode: false
      },
      {
        role: 'assistant',
        content: '根据《2024年全球教育技术报告》，全球约60%的教育机构正在使用AI技术，其中个性化学习占38%，智能评估占25%...',
        model: 'qwen-flash',
        timestamp: 1700380420000,
        potMode: false
      }
    ],
    
    // 李思雨的PoT模式对话（简化版）
    'demo-aigc-log-2': [
      {
        role: 'user',
        content: '关于AI个性化学习，我想深入了解一下技术原理',
        model: 'pot-tutor',
        timestamp: 1700470800000,
        potMode: true
      },
      {
        role: 'assistant',
        content: '在深入技术原理之前，你觉得"个性化学习"最核心的要素是什么？',
        model: 'pot-tutor', 
        timestamp: 1700470820000,
        potMode: true
      },
      {
        role: 'user',
        content: '我觉得是学习路径，每个人的基础和学习习惯不同',
        model: 'pot-tutor',
        timestamp: 1700470900000, 
        potMode: true
      },
      {
        role: 'assistant',
        content: '理解得很深刻！那么AI系统是如何"知道"每个学习者的不同需求的呢？',
        model: 'pot-tutor',
        timestamp: 1700470920000,
        potMode: true
      },
      {
        role: 'user',
        content: '通过学习行为数据吧，比如答题准确率、停留时间等',
        model: 'pot-tutor',
        timestamp: 1700471000000,
        potMode: true
      }
    ],
    
    // 王志豪的普通模式对话（PoT-Mode OFF）
    'demo-aigc-log-3': [
      {
        role: 'user',
        content: '请帮我写一篇关于人工智能对教育影响的文章大纲',
        model: 'qwen-plus',
        timestamp: 1700500000000,
        potMode: false
      },
      {
        role: 'assistant',
        content: '以下是人工智能对教育影响的文章大纲：\n\n一、引言\n- AI技术在教育领域的兴起\n- 研究意义和目标\n\n二、AI对教学方式的改变\n- 个性化教学\n- 智能辅导系统\n\n三、AI对学习效果的提升\n- 自适应学习\n- 学习分析\n\n四、挑战与思考\n- 技术局限性\n- 教师角色变化\n\n五、结论与展望',
        model: 'qwen-plus',
        timestamp: 1700500020000,
        potMode: false
      },
      {
        role: 'user',
        content: '能具体说说个性化教学是怎么实现的吗？',
        model: 'qwen-plus',
        timestamp: 1700500100000,
        potMode: false
      },
      {
        role: 'assistant',
        content: 'AI个性化教学主要通过以下方式实现：\n\n1. 学习者画像构建：收集学生的学习历史、能力水平、学习风格等数据\n\n2. 内容推荐：基于学生特点推荐适合的学习资源\n\n3. 路径规划：为每个学生设计最优的学习路径\n\n4. 实时调整：根据学习进度动态调整教学内容和难度',
        model: 'qwen-plus',
        timestamp: 1700500120000,
        potMode: false
      }
    ],
    
    // 陈欣怡的普通模式对话（PoT-Mode OFF，逾期提交）
    'demo-aigc-log-4': [
      {
        role: 'user',
        content: 'AI技术对传统教育模式带来了哪些冲击？请简要分析',
        model: 'ernie-speed',
        timestamp: 1700550000000,
        potMode: false
      },
      {
        role: 'assistant',
        content: 'AI技术对传统教育模式的主要冲击包括：\n\n1. 教学模式转变：从"一对多"向"一对一"个性化教学转变\n\n2. 教师角色重新定义：从知识传授者转向学习引导者和促进者\n\n3. 学习评价方式改变：从单一标准化考试转向多元化、过程性评价\n\n4. 教育资源配置优化：AI可以让优质教育资源更好地惠及偏远地区',
        model: 'ernie-speed',
        timestamp: 1700550020000,
        potMode: false
      },
      {
        role: 'user',
        content: '这些变化可能带来哪些挑战？',
        model: 'ernie-speed',
        timestamp: 1700550100000,
        potMode: false
      },
      {
        role: 'assistant',
        content: '主要挑战包括：\n\n1. 技术依赖风险：过度依赖AI可能削弱学生的独立思考能力\n\n2. 数字鸿沟加剧：技术能力和资源差异可能扩大教育不平等\n\n3. 隐私安全问题：学习数据的收集和使用涉及隐私保护\n\n4. 教师适应压力：需要教师掌握新技术，转变教学理念',
        model: 'ernie-speed',
        timestamp: 1700550120000,
        potMode: false
      }
    ]
  },

  // 示例提交数据
  submissions: [
    // 已截止任务的提交记录
    // 正常提交（PoT模式）
    {
      _id: 'demo-submission-1',
      task: 'demo-task-1',
      student: 'demo-student-1',
      content: '通过深入研究，我发现人工智能正在重塑教育领域...',
      imageIds: ['demo-image-1', 'demo-image-2'],
      fileId: 'demo-file-1',
      fileName: '张晓明-AI教育影响分析.docx',
      aigcLogId: 'demo-aigc-log-1',
      submittedAt: new Date('2024-11-19T16:30:00'),
      isLateSubmission: false,
      lateMinutes: 0,
      potModeData: {
        hasPotMode: true,
        potMessages: 15,
        normalMessages: 3,
        detectedAt: new Date('2024-11-19T16:30:00')
      }
    },
    // 正常提交（PoT模式）
    {
      _id: 'demo-submission-2', 
      task: 'demo-task-1',
      student: 'demo-student-2',
      content: '在调研过程中，我发现AI技术在个性化学习方面具有巨大潜力...',
      imageIds: ['demo-image-3'],
      fileId: 'demo-file-2',
      fileName: '李思雨-人工智能教育变革.pdf',
      aigcLogId: 'demo-aigc-log-2',
      submittedAt: new Date('2024-11-20T14:20:00'),
      isLateSubmission: false,
      lateMinutes: 0,
      potModeData: {
        hasPotMode: true,
        potMessages: 22,
        normalMessages: 1,
        detectedAt: new Date('2024-11-20T14:20:00')
      }
    },
    // 普通提交（PoT-Mode OFF）
    {
      _id: 'demo-submission-3',
      task: 'demo-task-1', 
      student: 'demo-student-3',
      content: '人工智能技术的快速发展为教育带来了前所未有的机遇...',
      imageIds: [],
      fileId: 'demo-file-3',
      fileName: '王志豪-AI教育思考.txt',
      aigcLogId: 'demo-aigc-log-3', // 添加AIGC记录
      submittedAt: new Date('2024-11-20T22:45:00'),
      isLateSubmission: false,
      lateMinutes: 0,
      potModeData: {
        hasPotMode: false, // PoT-Mode OFF
        potMessages: 0,
        normalMessages: 4, // 4轮普通对话
        detectedAt: new Date('2024-11-20T22:45:00')
      }
    },
    // 逾期提交（PoT-Mode OFF）
    {
      _id: 'demo-submission-4',
      task: 'demo-task-1',
      student: 'demo-student-4',
      content: '抱歉提交较晚，关于AI在教育中的应用，我有以下思考...',
      imageIds: [],
      fileId: 'demo-file-4', 
      fileName: '陈欣怡-AI教育反思.docx',
      aigcLogId: 'demo-aigc-log-4', // 添加AIGC记录
      submittedAt: new Date('2024-11-21T10:15:00'), // 逾期提交
      isLateSubmission: true,
      lateMinutes: 615, // 逾期10小时15分钟
      potModeData: {
        hasPotMode: false, // PoT-Mode OFF
        potMessages: 0,
        normalMessages: 4, // 4轮普通对话
        detectedAt: new Date('2024-11-21T10:15:00')
      }
    },
    // 未提交（刘宇航 demo-student-5 没有提交记录）
    
    // 即将截止任务的提交记录（2个提交）
    {
      _id: 'demo-submission-5',
      task: 'demo-task-2',
      student: 'demo-student-1', 
      content: '针对校园塑料废物问题，我提出以下解决方案：1. 建立智能回收站...',
      imageIds: ['demo-image-4', 'demo-image-5'],
      fileId: null,
      fileName: null,
      aigcLogId: null,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前提交
      isLateSubmission: false,
      lateMinutes: 0,
      potModeData: {
        hasPotMode: false,
        potMessages: 0,
        normalMessages: 0,
        detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    },
    {
      _id: 'demo-submission-6',
      task: 'demo-task-2',
      student: 'demo-student-3',
      content: '我的绿色校园计划包含三个核心模块：节能改造、绿色交通、环保宣传...',
      imageIds: ['demo-image-6'],
      fileId: null,
      fileName: null, 
      aigcLogId: null,
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前提交
      isLateSubmission: false,
      lateMinutes: 0,
      potModeData: {
        hasPotMode: false,
        potMessages: 0,
        normalMessages: 0,
        detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    }
    
    // 进行中任务（demo-task-3）目前0个提交，符合要求
  ]
};

export const SandboxProvider = ({ children }) => {
  // 🎭 沙盒模式状态
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [showFirstTimeWelcome, setShowFirstTimeWelcome] = useState(false);
  
  // 🗃️ 沙盒运行时数据（在内存中的临时修改）
  const [sandboxChanges, setSandboxChanges] = useState(new Map());

  // 🎯 初始化检查（检查是否首次登录）
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenSandboxWelcome');
    if (!hasSeenWelcome) {
      setShowFirstTimeWelcome(true);
    }
  }, []);

  // 🔧 沙盒模式切换
  const toggleSandboxMode = (enabled) => {
    console.log(`沙盒模式 ${enabled ? '开启' : '关闭'}`);
    setIsSandboxMode(enabled);
    
    // 清除之前的沙盒修改
    if (!enabled) {
      setSandboxChanges(new Map());
    }
  };

  // 📝 记录沙盒中的操作（暂时只记录，不实际执行）
  const recordSandboxChange = (type, id, data) => {
    if (!isSandboxMode) return;
    
    const newChanges = new Map(sandboxChanges);
    const changeKey = `${type}-${id}`;
    newChanges.set(changeKey, {
      type,
      id, 
      data,
      timestamp: new Date()
    });
    setSandboxChanges(newChanges);
    
    console.log(`沙盒操作记录: ${type}`, { id, data });
  };

  // 🧹 清空沙盒修改
  const clearSandboxChanges = () => {
    setSandboxChanges(new Map());
    console.log('沙盒修改已清空');
  };

  // 🎁 标记已看过欢迎提示
  const markWelcomeSeen = useCallback(() => {
    localStorage.setItem('hasSeenSandboxWelcome', 'true');
    setShowFirstTimeWelcome(false);
    console.log('已标记看过沙盒欢迎提示');
  }, []);

  // 🎯 获取沙盒数据（应用运行时修改）
  const getSandboxData = (dataType) => {
    if (!isSandboxMode) return null;
    
    const baseData = DEMO_DATA[dataType] || [];
    
    // TODO: 后续步骤中会实现应用运行时修改的逻辑
    // 目前先返回基础示例数据
    return baseData;
  };

  const value = {
    // 状态
    isSandboxMode,
    showFirstTimeWelcome,
    sandboxChanges,
    
    // 操作方法  
    toggleSandboxMode,
    recordSandboxChange,
    clearSandboxChanges,
    markWelcomeSeen,
    getSandboxData,
    
    // 示例数据（仅供调试）
    DEMO_DATA: process.env.NODE_ENV === 'development' ? DEMO_DATA : undefined
  };

  return (
    <SandboxContext.Provider value={value}>
      {children}
    </SandboxContext.Provider>
  );
};