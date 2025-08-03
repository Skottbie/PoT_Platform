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

// ✅ 学生提交作业（含文件上传）
router.post('/:taskId', verifyToken, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'aigcLog', maxCount: 1 }
]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: '任务不存在' });

    const file = req.files?.file?.[0];
    if (!file) return res.status(400).json({ message: '缺少作业文件' });
    
    // 📌 核心修改：对文件名进行显式解码
    const fileNameBuffer = Buffer.from(file.originalname, 'latin1');
    const decodedFileName = fileNameBuffer.toString('utf8');

    // 上传文件到 GridFS 并获取文件名和文件ID
    const { fileId } = await uploadToGridFS(file, decodedFileName);

    let aigcLogId = null;
    if (req.files?.aigcLog?.[0]) {
      const logFile = req.files.aigcLog[0];
      // ⚠️ AIGC 日志文件是纯英文名，无需特殊解码
      const logResult = await uploadToGridFS(logFile, logFile.originalname);
      aigcLogId = logResult.fileId;
    }

    const submission = new Submission({
      task: req.params.taskId,
      student: req.user.id,
      fileId: fileId,
      fileName: decodedFileName, // ⚠️ 保存解码后的文件名
      aigcLogId: aigcLogId,
    });

    await submission.save();
    res.json({ message: '提交成功', fileId });
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