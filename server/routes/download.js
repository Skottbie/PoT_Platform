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
const { GridFSBucket, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const router = express.Router();

function getGridFSBucket() {
  return new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
}

// ✅ 下载文件
router.get('/:id', async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    const fileId = new ObjectId(req.params.id);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('文件不存在');
    }

    res.set('Content-Type', files[0].contentType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(files[0].filename)}"`);

    bucket.openDownloadStream(fileId).pipe(res);
  } catch (err) {
    console.error('下载出错:', err);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;