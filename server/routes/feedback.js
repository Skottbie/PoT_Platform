const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
//const verifyToken = require('../middleware/auth'); // 如果你想只允许登录用户反馈，可以用

router.post('/', async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: '反馈内容不能为空' });
  }

  try {
    const feedback = new Feedback({
      content,
      userId: req.user ? req.user.id : null,
      userEmail: req.user ? req.user.email : '',
    });

    await feedback.save();

    res.status(201).json({ message: '反馈已收到' });
  } catch (err) {
    console.error('保存反馈失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
