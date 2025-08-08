// server/routes/submission.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// multer 配置：将文件临时存储在内存或指定目录
const upload = multer({ dest: 'tmp/' }); 

// 创建 GridFSBucket（复用 mongoose 连接）
function getGridFSBucket() {
  return new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads' // GridFS 集合名：uploads.files / uploads.chunks
  });
}

// 📌 核心修改：uploadToGridFS 函数现在接受一个已解码的文件名
async function uploadToGridFS(file, decodedFilename) {
  const bucket = getGridFSBucket();
  const stream = fs.createReadStream(file.path);

  return new Promise((resolve, reject) => {
    // ⚠️ 使用解码后的文件名作为 GridFS 的 filename
    const uploadStream = bucket.openUploadStream(decodedFilename, {
      contentType: file.mimetype
    });

    stream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        fs.unlinkSync(file.path); // 删除临时文件
        resolve({
          fileId: uploadStream.id.toString(),
          filename: decodedFilename, // 返回解码后的文件名
          contentType: file.mimetype,
        });
      });
  });
}

// ✅ 学生提交作业（支持多种类型 + 截止时间检查）
router.post('/:taskId', verifyToken, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: 'aigcLog', maxCount: 1 }
]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: '任务不存在' });

    // 📌 新增：检查是否已提交
    const existingSubmission = await Submission.findOne({
      task: req.params.taskId,
      student: req.user.id
    });
    
    if (existingSubmission) {
      return res.status(400).json({ message: '你已提交过该任务，无法重复提交' });
    }

    // 📌 新增：截止时间检查
    const now = new Date();
    const deadline = new Date(task.deadline);
    const isLate = now > deadline;
    
    // 如果逾期且不允许逾期提交，则拒绝
    if (isLate && !task.allowLateSubmission) {
      return res.status(400).json({ message: '任务已截止，不允许逾期提交' });
    }

    // 获取提交的文本内容和逾期信息
    const { content, isLateSubmission, lateMinutes } = req.body;
    const file = req.files?.file?.[0];
    const images = req.files?.images;
    const aigcLogFile = req.files?.aigcLog?.[0];

    // 📌 验证提交逻辑
    if (task.needsFile && !file) {
      return res.status(400).json({ message: '本任务要求上传作业文件。' });
    }

    if (task.requireAIGCLog && !aigcLogFile) {
      return res.status(400).json({ message: '本任务要求上传 AIGC 原始记录。' });
    }

    if (!file && (!images || images.length === 0) && !content) {
      return res.status(400).json({ message: '请提交作业内容（文件、图片或文本）。' });
    }

    let fileId = null;
    let fileName = null;
    let aigcLogId = null;
    const imageIds = [];

    // 处理作业文件
    if (file) {
      const fileNameBuffer = Buffer.from(file.originalname, 'latin1');
      const decodedFileName = fileNameBuffer.toString('utf8');
      const fileResult = await uploadToGridFS(file, decodedFileName);
      fileId = fileResult.fileId;
      fileName = fileResult.filename;
    }

    // 处理图片文件
    if (images && images.length > 0) {
      for (const image of images) {
        const imageNameBuffer = Buffer.from(image.originalname, 'latin1');
        const decodedImageName = imageNameBuffer.toString('utf8');
        const imageResult = await uploadToGridFS(image, decodedImageName);
        imageIds.push(imageResult.fileId);
      }
    }

    // 处理 AIGC 日志
    if (aigcLogFile) {
      const logResult = await uploadToGridFS(aigcLogFile, aigcLogFile.originalname);
      aigcLogId = logResult.fileId;
    }

    // 📌 新增：计算逾期时间
    let actualLateMinutes = 0;
    if (isLate) {
      actualLateMinutes = Math.floor((now - deadline) / (1000 * 60));
    }

    const submission = new Submission({
      task: req.params.taskId,
      student: req.user.id,
      content: content || '',
      imageIds: imageIds,
      fileId: fileId,
      fileName: fileName,
      aigcLogId: aigcLogId,
      // 📌 新增：逾期信息
      isLateSubmission: isLate,
      lateMinutes: actualLateMinutes
    });

    await submission.save();
    
    if (isLate) {
      res.json({ 
        message: '逾期提交成功，该作业将被标注为逾期提交',
        isLateSubmission: true,
        lateMinutes: actualLateMinutes
      });
    } else {
      res.json({ message: '提交成功' });
    }
  } catch (err) {
    console.error('提交失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 获取某任务的所有提交记录（教师查看）
router.get('/by-task/:taskId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权限查看提交记录' });
    }

    const submissions = await Submission.find({ task: req.params.taskId })
      .populate('student', 'email')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: '获取提交失败', error: err.message });
  }
});

// ✅ 获取某个学生的提交记录
router.get('/by-student/:studentId', verifyToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.params.studentId }).populate('task', 'title');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: '获取提交失败', error: err.message });
  }
});

// check路由
router.get('/check/:taskId', verifyToken, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const studentId = req.user.id;

    const existing = await Submission.findOne({ task: taskId, student: studentId });
    
    let submissionInfo = null;
    if (existing) {
      submissionInfo = {
        submittedAt: existing.submittedAt,
        isLateSubmission: existing.isLateSubmission,
        lateMinutes: existing.lateMinutes,
        // 📌 新增：反馈相关信息
        hasFeedback: !!(existing.feedback && existing.feedback.content),
        feedbackRating: existing.feedback?.rating || null,
        feedbackPreview: existing.feedback?.content ? 
          (existing.feedback.content.length > 50 ? 
            existing.feedback.content.substring(0, 50) + '...' : 
            existing.feedback.content) : null
      };
    }
    
    res.json({ 
      submitted: !!existing,
      submission: submissionInfo
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 学生查看自己在指定任务的提交记录
router.get('/my/:taskId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: '仅限学生查看自己的提交记录' });
    }

    const taskId = req.params.taskId;
    const studentId = req.user.id;

    const submission = await Submission.findOne({ 
      task: taskId, 
      student: studentId 
    }).populate('feedback.createdBy', 'email');

    if (!submission) {
      return res.status(404).json({ message: '未找到提交记录' });
    }

    res.json(submission);
  } catch (err) {
    console.error('获取学生提交记录失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;