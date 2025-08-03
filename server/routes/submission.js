//server/routes/submission.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');

const upload = multer({ dest: 'tmp/' }); 


// 上传设置
/* 前multer存储方案
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
*/

/*
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();

    // 关键：将原始名称从 latin1 解码为 utf8
    let originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

    originalName = path.basename(originalName).replace(/\s+/g, '_');

    cb(null, `${timestamp}-${originalName}`);
  }
});
*/
// 创建 GridFSBucket（复用 mongoose 连接）
function getGridFSBucket() {
  return new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads' // GridFS 集合名：uploads.files / uploads.chunks
  });
}
// 上传文件并返回 GridFS 文件 ID
async function uploadToGridFS(file) {
  const bucket = getGridFSBucket();
  const stream = fs.createReadStream(file.path);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype
    });

    stream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        fs.unlinkSync(file.path); // 删除临时文件
        resolve(uploadStream.id.toString()); // 返回文件ID
      });
  });
}
//const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;

// ✅ 学生提交作业（含文件上传）
/*
router.post('/:taskId', verifyToken, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'aigcLog', maxCount: 1 }
]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: '任务不存在' });

    //const fileUrl = req.files?.file?.[0]?.path;
    //const aigcLogUrl = req.files?.aigcLog?.[0]?.path || null;
    const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fileUrl = req.files?.file?.[0] 
      ? `${host}/uploads/${req.files.file[0].filename}`
      : null;

    const aigcLogUrl = req.files?.aigcLog?.[0] 
      ? `${host}/uploads/${req.files.aigcLog[0].filename}`
      : null;

    if (!fileUrl) return res.status(400).json({ message: '缺少作业文件' });

    const submission = new Submission({
      task: req.params.taskId,
      student: req.user.id,
      fileUrl,
      aigcLogUrl,
    });

    await submission.save();
    res.json({ message: '提交成功' });
  } catch (err) {
    console.error('提交失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});
*/

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

    // 上传文件到 GridFS
    const fileId = await uploadToGridFS(file);
    let aigcLogId = null;

    if (req.files?.aigcLog?.[0]) {
      aigcLogId = await uploadToGridFS(req.files.aigcLog[0]);
    }

    const submission = new Submission({
      task: req.params.taskId,
      student: req.user.id,
      fileUrl: `/api/files/${fileId}`,
      aigcLogUrl: aigcLogId ? `/api/files/${aigcLogId}` : null,
    });

    await submission.save();
    res.json({ message: '提交成功' });
  } catch (err) {
    console.error('提交失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
