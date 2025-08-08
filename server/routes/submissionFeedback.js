// server/routes/submissionFeedback.js - 教师反馈路由

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Submission = require('../models/Submission');
const Task = require('../models/Task');

// 教师提交反馈
router.post('/:submissionId/feedback', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '只有教师可以提供反馈' });
    }

    const { submissionId } = req.params;
    const { content, rating } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: '反馈内容不能为空' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: '评分必须在1-5之间' });
    }

    // 查找提交记录
    const submission = await Submission.findById(submissionId).populate('task');
    if (!submission) {
      return res.status(404).json({ message: '提交记录不存在' });
    }

    // 验证教师是否有权限对此提交进行反馈（必须是任务创建者）
    if (submission.task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: '只有任务创建者可以对此提交进行反馈' });
    }

    // 更新反馈
    submission.feedback = {
      content: content.trim(),
      rating: rating || null,
      createdAt: submission.feedback.createdAt || new Date(),
      createdBy: req.user.id,
      updatedAt: new Date()
    };

    await submission.save();

    res.json({
      success: true,
      message: '反馈提交成功',
      feedback: submission.feedback
    });

  } catch (err) {
    console.error('提交反馈失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取提交记录的反馈
router.get('/:submissionId/feedback', verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId)
      .populate('feedback.createdBy', 'email')
      .populate('task');

    if (!submission) {
      return res.status(404).json({ message: '提交记录不存在' });
    }

    // 权限检查：学生只能查看自己的反馈，教师只能查看自己任务的反馈
    if (req.user.role === 'student') {
      if (submission.student.toString() !== req.user.id) {
        return res.status(403).json({ message: '无权限查看此反馈' });
      }
    } else if (req.user.role === 'teacher') {
      if (submission.task.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: '无权限查看此反馈' });
      }
    }

    res.json({
      success: true,
      feedback: submission.feedback
    });

  } catch (err) {
    console.error('获取反馈失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除反馈
router.delete('/:submissionId/feedback', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '只有教师可以删除反馈' });
    }

    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId).populate('task');
    if (!submission) {
      return res.status(404).json({ message: '提交记录不存在' });
    }

    // 验证权限
    if (submission.task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: '只有任务创建者可以删除反馈' });
    }

    // 清空反馈
    submission.feedback = {
      content: '',
      rating: null,
      createdAt: null,
      createdBy: null,
      updatedAt: null
    };

    await submission.save();

    res.json({
      success: true,
      message: '反馈已删除'
    });

  } catch (err) {
    console.error('删除反馈失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
