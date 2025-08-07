// server/routes/analytics.js - 创建此文件
const express = require('express');
const router = express.Router();

const performanceData = []; // 简单内存存储

router.post('/performance', (req, res) => {
  const { loadTime, domContentLoaded, url, userAgent } = req.body;
  
  performanceData.push({
    loadTime,
    domContentLoaded,
    url,
    userAgent,
    timestamp: new Date()
  });
  
  // 只保留最近1000条
  if (performanceData.length > 1000) {
    performanceData.splice(0, performanceData.length - 1000);
  }
  
  res.json({ success: true });
});

router.get('/performance', (req, res) => {
  if (performanceData.length === 0) {
    return res.json({
      message: '暂无性能数据',
      count: 0,
      average: 0
    });
  }

  const avg = performanceData.reduce((acc, curr) => acc + curr.loadTime, 0) / performanceData.length;
  res.json({
    average: Math.round(avg),
    count: performanceData.length,
    recent: performanceData.slice(-10).map(item => ({
      loadTime: item.loadTime,
      url: item.url,
      timestamp: item.timestamp
    }))
  });
});

module.exports = router;