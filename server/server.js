// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const aigcRoutes = require('./routes/aigc');
const classRoutes = require('./routes/classRoutes');
const feedbackRouter = require('./routes/feedback');
const allowedOrigins = [
  'http://localhost:5173',
  'https://pot-platform.vercel.app',
  'https://potacademy.net',
  'https://www.potacademy.net'
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

app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.2.42:5173'], // 允许前端访问的源
  credentials: true // 允许发送 Cookie
}));

app.use('/api/class', classRoutes);

app.use('/api/feedback', feedbackRouter);


// 数据库连接
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB 连接成功'))
  .catch(err => console.error('❌ MongoDB 连接失败：', err));

// 启动服务器
const PORT = process.env.PORT || 5000;
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

