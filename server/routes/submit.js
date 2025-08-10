//server/routes/submit.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Submission = require('../models/Submission');
const Task = require('../models/Task');

// ✅ 学生提交作业（防重复）
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: '仅限学生提交作业' });
    }

    const { taskId, fileUrl, aigcLog } = req.body;

    // ✅ 检查是否已提交过该任务
    const existing = await Submission.findOne({
      task: taskId,
      student: req.user.id
    });
    if (existing) {
      return res.status(400).json({ message: '你已提交过该任务，无法重复提交' });
    }

    const submission = new Submission({
      task: taskId,
      student: req.user.id,
      fileUrl,
      aigcLog
    });

    await submission.save();
    res.status(201).json({ message: '提交成功', submission });
  } catch (err) {
    console.error('提交作业时出错：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});


module.exports = router;

// ✅ 教师查看某任务下所有提交记录
router.get('/by-task/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权限查看提交记录' });
    }

    const taskId = req.params.id;

    const submissions = await Submission.find({ task: taskId })
      .populate('student', 'email role') // 显示学生邮箱等基本信息
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 判断当前学生是否已提交指定任务
router.get('/check/:taskId', verifyToken, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const studentId = req.user.id;

    const existing = await Submission.findOne({ task: taskId, student: studentId });
    res.json({ submitted: !!existing });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});
