// server/routes/auth.js 增加refresh token功能

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken'); // 需要创建这个模型

// 生成tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 短期access token
  );
  
  const refreshToken = jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // 长期refresh token
  );
  
  return { accessToken, refreshToken };
};

// 登录接口 - 支持"记住我"
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

    // 保存refresh token到数据库
    const refreshTokenDoc = new RefreshToken({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
      rememberMe
    });
    await refreshTokenDoc.save();

    // 设置refresh token到httpOnly cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 记住我30天，否则7天
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    res.json({
      token: accessToken,
      role: user.role,
      expiresIn: 15 * 60, // 15分钟
      rememberMe
    });
  } catch (err) {
    console.error('登录错误详情:', err); // 添加这行
    res.status(500).json({ message: '服务器错误' });
  }
});

// 刷新token接口
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
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      // 用户不存在或token版本不匹配（用户已在其他地方登出）
      return res.status(401).json({ message: 'Refresh token已失效' });
    }

    // 生成新的tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // 撤销旧的refresh token
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    // 保存新的refresh token
    const newTokenDoc = new RefreshToken({
      token: newRefreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + (tokenDoc.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
      rememberMe: tokenDoc.rememberMe
    });
    await newTokenDoc.save();

    // 设置新的refresh token cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenDoc.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
    };

    res.cookie('refreshToken', newRefreshToken, cookieOptions);
    
    res.json({
      token: accessToken,
      expiresIn: 15 * 60
    });
  } catch (err) {
    console.error('刷新token失败:', err);
    res.status(401).json({ message: 'Refresh token无效' });
  }
});

// 登出接口 - 撤销refresh token
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (refreshToken) {
    try {
      // 撤销refresh token
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true }
      );
    } catch (err) {
      console.error('撤销refresh token失败:', err);
    }
  }

  // 清除cookie
  res.clearCookie('refreshToken');
  res.json({ message: '登出成功' });
});

// 全局登出 - 撤销用户所有refresh token
router.post('/logout-all', async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      // 撤销该用户所有refresh token
      await RefreshToken.updateMany(
        { userId: decoded.id, isRevoked: false },
        { isRevoked: true }
      );

      // 增加用户的token版本，使所有现有的access token失效
      await User.findByIdAndUpdate(decoded.id, { 
        $inc: { tokenVersion: 1 } 
      });
    } catch (err) {
      console.error('全局登出失败:', err);
    }
  }

  res.clearCookie('refreshToken');
  res.json({ message: '全局登出成功' });
});

module.exports = router;