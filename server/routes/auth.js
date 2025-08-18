// server/routes/auth.js - 优化版本
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// 生成tokens - 优化时长
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' } // 延长到2小时，减少刷新频率
  );
  
  const refreshToken = jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion || 1 },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '30d' } // 统一30天
  );
  
  return { accessToken, refreshToken };
};

// 登录接口
router.post('/login', async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: '密码错误' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // 清理该用户旧的refresh tokens（保持最多5个有效token）
    await RefreshToken.deleteMany({
      userId: user._id,
      $or: [
        { isRevoked: true },
        { expiresAt: { $lt: new Date() } }
      ]
    });

    const activeTokens = await RefreshToken.countDocuments({
      userId: user._id,
      isRevoked: false,
      expiresAt: { $gte: new Date() }
    });

    if (activeTokens >= 5) {
      // 删除最旧的token
      const oldestToken = await RefreshToken.findOne({
        userId: user._id,
        isRevoked: false
      }).sort({ createdAt: 1 });
      
      if (oldestToken) {
        oldestToken.isRevoked = true;
        await oldestToken.save();
      }
    }

    // 保存新的refresh token
    const refreshTokenDoc = new RefreshToken({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天
      rememberMe
    });
    await refreshTokenDoc.save();

    // 设置httpOnly cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    res.json({
      token: accessToken,
      role: user.role,
      expiresIn: 2 * 60 * 60, // 2小时
      rememberMe
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 刷新token接口 - 简化版本
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    return res.status(401).json({ message: '未找到refresh token' });
  }

  try {
    // 验证refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // 检查数据库中的refresh token
    const tokenDoc = await RefreshToken.findOne({ 
      token: refreshToken, 
      userId: decoded.id,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(401).json({ message: 'Refresh token无效' });
    }

    // 获取用户信息
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Refresh token已失效' });
    }

    // 生成新的access token（不轮换refresh token，减少复杂性）
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 更新refresh token的最后使用时间
    tokenDoc.lastUsedAt = new Date();
    await tokenDoc.save();
    
    res.json({
      token: accessToken,
      expiresIn: 2 * 60 * 60 // 2小时
    });
  } catch (err) {
    console.error('刷新token失败:', err);
    res.status(401).json({ message: 'Refresh token无效' });
  }
});

// 登出接口
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (refreshToken) {
    try {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true }
      );
    } catch (err) {
      console.error('撤销refresh token失败:', err);
    }
  }

  res.clearCookie('refreshToken');
  res.json({ message: '登出成功' });
});

// 全局登出
router.post('/logout-all', async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      await RefreshToken.updateMany(
        { userId: decoded.id, isRevoked: false },
        { isRevoked: true }
      );
    } catch (err) {
      console.error('全局登出失败:', err);
    }
  }

  res.clearCookie('refreshToken');
  res.json({ message: '全局登出成功' });
});

module.exports = router;