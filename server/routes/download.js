// server/routes/download.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const sharp = require('sharp');
const verifyToken = require('../middleware/auth');

// 创建 GridFSBucket（复用 mongoose 连接）
function getGridFSBucket() {
  return new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
}

// 缓存配置
const CACHE_DURATION = 7 * 24 * 60 * 60; // 7天

// 设置缓存头
function setCacheHeaders(res) {
  res.set('Cache-Control', `public, max-age=${CACHE_DURATION}`);
  res.set('ETag', Date.now().toString());
}

// 检查文件是否为图片
function isImage(contentType) {
  return contentType && contentType.startsWith('image/');
}

// 生成缩略图
async function generateThumbnail(buffer, size = 200) {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer();
  } catch (error) {
    console.error('缩略图生成失败:', error);
    // 如果sharp处理失败，返回原图
    return buffer;
  }
}

// 生成预览图
async function generatePreview(buffer, maxWidth = 800) {
  try {
    return await sharp(buffer)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toBuffer();
  } catch (error) {
    console.error('预览图生成失败:', error);
    return buffer;
  }
}

// 原始文件下载（保持现有功能）
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    const fileId = new ObjectId(req.params.id);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('文件不存在');
    }

    const file = files[0];
    const filename = file.filename;
    
    const encodedFilename = encodeURIComponent(filename);
    const contentDisposition = `attachment; filename*=UTF-8''${encodedFilename}`;

    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Disposition', contentDisposition);
    setCacheHeaders(res);

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

// 缩略图接口
router.get('/:id/thumbnail', verifyToken, async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    const fileId = new ObjectId(req.params.id);
    const size = parseInt(req.query.size) || 200;

    // 检查文件是否存在
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('文件不存在');
    }

    const file = files[0];
    
    // 非图片文件返回404
    if (!isImage(file.contentType)) {
      return res.status(404).send('非图片文件');
    }

    // 设置响应头
    res.set('Content-Type', 'image/jpeg');
    setCacheHeaders(res);

    // 读取文件到内存
    const downloadStream = bucket.openDownloadStream(fileId);
    const chunks = [];
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const thumbnail = await generateThumbnail(buffer, size);
        res.send(thumbnail);
      } catch (error) {
        console.error('缩略图处理失败:', error);
        res.status(500).send('缩略图生成失败');
      }
    });

    downloadStream.on('error', (error) => {
      console.error('读取文件失败:', error);
      res.status(500).send('服务器错误');
    });

  } catch (err) {
    console.error('缩略图接口出错:', err);
    res.status(500).send('服务器错误');
  }
});

// 预览图接口
router.get('/:id/preview', verifyToken, async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    const fileId = new ObjectId(req.params.id);
    const maxWidth = parseInt(req.query.width) || 800;

    // 检查文件是否存在
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('文件不存在');
    }

    const file = files[0];
    
    // 非图片文件返回404
    if (!isImage(file.contentType)) {
      return res.status(404).send('非图片文件');
    }

    // 设置响应头
    res.set('Content-Type', 'image/jpeg');
    setCacheHeaders(res);

    // 读取文件到内存
    const downloadStream = bucket.openDownloadStream(fileId);
    const chunks = [];
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const preview = await generatePreview(buffer, maxWidth);
        res.send(preview);
      } catch (error) {
        console.error('预览图处理失败:', error);
        res.status(500).send('预览图生成失败');
      }
    });

    downloadStream.on('error', (error) => {
      console.error('读取文件失败:', error);
      res.status(500).send('服务器错误');
    });

  } catch (err) {
    console.error('预览图接口出错:', err);
    res.status(500).send('服务器错误');
  }
});

// 图片信息接口（用于前端判断是否为图片）
router.get('/:id/info', verifyToken, async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    const fileId = new ObjectId(req.params.id);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const file = files[0];
    
    res.json({
      filename: file.filename,
      contentType: file.contentType,
      length: file.length,
      uploadDate: file.uploadDate,
      isImage: isImage(file.contentType)
    });
  } catch (err) {
    console.error('获取文件信息出错:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;