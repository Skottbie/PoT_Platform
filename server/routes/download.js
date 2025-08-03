/*
const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('下载出错:', err);
      res.status(404).send('文件不存在');
    }
  });
});

module.exports = router;
*/
// server/routes/download.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

// 创建 GridFSBucket（复用 mongoose 连接）
function getGridFSBucket() {
  return new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
}

router.get('/:id', async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    const fileId = new ObjectId(req.params.id);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('文件不存在');
    }

    const file = files[0];
    const filename = file.filename;
    
    // 📌 核心修改：使用 UTF-8 编码来处理文件名，解决乱码问题
    // 采用 RFC 5987 推荐的 filename* 参数格式
    const encodedFilename = encodeURIComponent(filename);
    const contentDisposition = `attachment; filename*=UTF-8''${encodedFilename}`;

    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Disposition', contentDisposition);

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('error', (error) => {
      console.error('下载流出错:', error);
      res.status(500).send('服务器错误');
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error('下载出错:', err);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;