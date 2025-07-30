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
