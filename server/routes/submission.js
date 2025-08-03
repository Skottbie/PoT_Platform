//server/routes/submission.js

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const multer = require('multer');
const path = require('path');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

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
// 使用 GridFS 存储
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: 'uploads', // bucket 名称
    };
  },
});





const upload = multer({ storage });
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

router.post(
  '/:taskId',
  verifyToken,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'aigcLog', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ message: '任务不存在' });

      const fileId = req.files?.file?.[0]?.id;
      if (!fileId) return res.status(400).json({ message: '缺少作业文件' });

      const aigcLogId = req.files?.aigcLog?.[0]?.id || null;

      // 存 fileId，而不是 URL
      const submission = new Submission({
        task: req.params.taskId,
        student: req.user.id,
        fileUrl: fileId, 
        aigcLogUrl: aigcLogId,
      });

      await submission.save();
      res.json({ message: '提交成功', fileId });
    } catch (err) {
      console.error('提交失败:', err);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

module.exports = router;
