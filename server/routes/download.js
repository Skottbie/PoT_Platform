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
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

const router = express.Router();

let gfs;
mongoose.connection.once('open', () => {
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection('uploads'); // bucketName
});

// 通过 fileId 下载文件
router.get('/:id', async (req, res) => {
  try {
    const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!file) return res.status(404).json({ message: '文件不存在' });

    const readStream = gfs.createReadStream({ _id: file._id });
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    readStream.pipe(res);
  } catch (err) {
    console.error('下载出错:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
