// server/server.js
const fetch = require('node-fetch');
globalThis.fetch = fetch;

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const aigcRoutes = require('./routes/aigc');
const classRoutes = require('./routes/classRoutes');
const feedbackRouter = require('./routes/feedback');

// 📌 新增：导入清理函数
const { cleanupRemovedStudents } = require('./controllers/classController');
const { cleanupDeletedTasks } = require('./controllers/taskManagementController');

const allowedOrigins = [
  'http://localhost:5173',
  'https://pot-platform.vercel.app',
  'https://potacademy.net',
  'https://www.potacademy.net',
  'https://api.potacademy.net'
];

dotenv.config();

const app = express();

// 中间件配置
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

const taskRoutes = require('./routes/task');
app.use('/api/task', taskRoutes);

const submitRoutes = require('./routes/submit');
app.use('/api/submit', submitRoutes);

const submissionRoutes = require('./routes/submission');
app.use('/api/submission', submissionRoutes);

app.use('/api/download', require('./routes/download'));

app.use('/api/submission', require('./routes/submit'));

app.use('/api/aigc', aigcRoutes);

// 路由（预留）
app.get('/', (req, res) => {
  res.send('后端服务正常运行');
});

app.use('/api/class', classRoutes);

app.use('/api/feedback', feedbackRouter);

app.use('/api/analytics', require('./routes/analytics'));


// 数据库连接
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB 连接成功');
    startCleanupTasks();
  })
  .catch(err => console.error('❌ MongoDB 连接失败：', err));

// 📌 新增：定时清理任务函数
const startCleanupTasks = () => {
  console.log('🧹 启动定时清理任务...');

  // 每天凌晨2点执行清理任务
  const scheduleCleanup = () => {
    const now = new Date();
    const next = new Date();

    // 设置为明天凌晨2点
    next.setDate(now.getDate() + 1);
    next.setHours(2, 0, 0, 0);

    const timeUntilNext = next.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        console.log('🧹 开始执行定时清理任务...');

        // 清理软删除的学生
        const cleanedStudents = await cleanupRemovedStudents();
        console.log(`✅ 清理了 ${cleanedStudents} 名过期的软删除学生`);

        // 清理软删除的任务
        const cleanedTasks = await cleanupDeletedTasks();
        console.log(`✅ 清理了 ${cleanedTasks} 个过期的软删除任务`);

        console.log('🎉 定时清理任务完成');

        // 安排下一次清理
        scheduleCleanup();
      } catch (error) {
        console.error('❌ 定时清理任务失败:', error);
        scheduleCleanup();
      }
    }, timeUntilNext);

    console.log(`⏰ 下一次清理时间: ${next.toLocaleString()}`);
  };

  scheduleCleanup();

  if (process.env.NODE_ENV === 'development') {
    setTimeout(async () => {
      try {
        console.log('🧹 执行启动时清理（开发模式）...');
        const cleanedStudents = await cleanupRemovedStudents();
        const cleanedTasks = await cleanupDeletedTasks();
        console.log(`✅ 启动清理完成: 学生 ${cleanedStudents} 个, 任务 ${cleanedTasks} 个`);
      } catch (error) {
        console.error('❌ 启动清理失败:', error);
      }
    }, 5000);
  }
};

const PORT = process.env.PORT || 5000;
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});