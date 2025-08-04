//server/routes/task.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const verifyToken = require('../middleware/auth');
const Class = require('../models/Class');


// ✅ 发布任务（仅限教师）
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权限发布任务' });
    }

    // 📌 修改：从 req.body 中解构出 needsFile
    const { title, description, category, allowAIGC, requireAIGCLog, needsFile, deadline, classIds } = req.body;

    const task = new Task({
      title,
      description,
      category,
      allowAIGC,
      requireAIGCLog,
      needsFile, // 📌 新增：保存 needsFile
      deadline,
      createdBy: req.user.id,
      classIds,
    });

    await task.save();
    res.status(201).json({ message: '任务发布成功', task });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 获取当前教师发布的任务
router.get('/mine', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权限查看任务' });
    }

    const tasks = await Task.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/all', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: '仅限学生访问任务列表' });
    }

    const myClasses = await Class.find({
      'studentList.userId': req.user.id
    });

    const joinedClassIds = myClasses.map(cls => cls._id);

    const tasks = await Task.find({
      classIds: { $in: joinedClassIds }
    }).sort({ createdAt: -1 })
      .populate('createdBy', 'email')
      .populate('classIds', 'name');

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 获取单个任务详情（学生提交作业页）
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: '任务不存在' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
