const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');



// ✅ 获取当前用户信息
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // 不返回密码
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 模拟登出接口（前端只需删掉 token）
router.post('/logout', (req, res) => {
  res.json({ message: '登出成功，请清除前端 token' });
});




module.exports = router;
