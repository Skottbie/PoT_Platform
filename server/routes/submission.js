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

// ✅ 学生提交作业（支持多种类型）
router.post('/:taskId', verifyToken, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'images', maxCount: 5 }, // 📌 新增：支持最多5张图片
  { name: 'aigcLog', maxCount: 1 }
]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: '任务不存在' });

    // 📌 新增：获取提交的文本内容
    const { content } = req.body;
    const file = req.files?.file?.[0];
    const images = req.files?.images;
    const aigcLogFile = req.files?.aigcLog?.[0];

    // 📌 验证提交逻辑
    // 1. 如果教师要求文件必交，但学生未上传，则返回错误
    if (task.needsFile && !file) {
      return res.status(400).json({ message: '本任务要求上传作业文件。' });
    }

    // 2. 如果教师要求AIGC日志必交，但学生未上传，则返回错误
    if (task.requireAIGCLog && !aigcLogFile) {
      return res.status(400).json({ message: '本任务要求上传 AIGC 原始记录。' });
    }

    // 3. 如果没有任何提交（文件、图片、文本），则返回错误
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
      const logResult = await uploadToGridFS(aigcLogFile, logFile.originalname);
      aigcLogId = logResult.fileId;
    }

    const submission = new Submission({
      task: req.params.taskId,
      student: req.user.id,
      content: content || '', // 📌 保存文本内容
      imageIds: imageIds, // 📌 保存图片ID数组
      fileId: fileId,
      fileName: fileName,
      aigcLogId: aigcLogId,
    });

    await submission.save();
    res.json({ message: '提交成功' });
  } catch (err) {
    console.error('提交失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 获取某任务的所有提交记录
router.get('/by-task/:taskId', verifyToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ task: req.params.taskId }).populate('student', 'email');
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


module.exports = router;
