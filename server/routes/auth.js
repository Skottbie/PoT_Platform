//server/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 注册接口
router.post('/register', async (req, res) => {
  // 📌 修改：从请求体中解构 inviteCode
  const { email, password, role, inviteCode } = req.body;

  // 📌 新增：邀请码验证逻辑
  const teacherInviteCode = process.env.TEACHER_INVITE_CODE;
  const studentInviteCode = process.env.STUDENT_INVITE_CODE;

  // 根据角色验证邀请码
  if (role === 'teacher' && inviteCode !== teacherInviteCode) {
    return res.status(400).json({ message: '教师邀请码不正确' });
  }

  if (role === 'student' && inviteCode !== studentInviteCode) {
    return res.status(400).json({ message: '学生邀请码不正确' });
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

const verifyToken = require('../middleware/auth');
//const { verifyToken } = require('../middleware/auth');

router.get('/me', verifyToken, (req, res) => {
  res.json({
    message: '这是受保护的信息',
    user: req.user  // token 解码信息：id, role
  });
});

module.exports = router;
