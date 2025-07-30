const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 内测白名单（你可以改成读数据库或 .env 中配置）
const whitelist = ['tayossx@gmail.com', 'stu@test.com', 'tst1@tst.com'];

// 注册接口
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  // 白名单验证
  if (!whitelist.includes(email)) {
    return res.status(403).json({ message: '你不在内测白名单中' });
  }

  // 重复用户检查
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: '用户已存在' });
  }

  // 密码加密
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed, role });

  await user.save();
  res.status(201).json({ message: '注册成功' });
});

// 登录接口
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 查找用户
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: '用户不存在' });
  }

  // 校验密码
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(400).json({ message: '密码错误' });
  }

  // 生成 Token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({ token, role: user.role });
});

module.exports = router;


const verifyToken = require('../middleware/auth');
//const { verifyToken } = require('../middleware/auth');


router.get('/me', verifyToken, (req, res) => {
  res.json({
    message: '这是受保护的信息',
    user: req.user  // token 解码信息：id, role
  });
});
