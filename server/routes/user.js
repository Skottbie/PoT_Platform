// server/routes/user.js - 扩展版本（添加昵称和偏好设置支持）

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

// ✅ 获取当前用户信息
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // 不返回密码
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 🆕 更新用户信息（包括昵称）
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { nickname } = req.body;
    
    // 验证昵称格式
    if (nickname !== null && nickname !== undefined) {
      if (typeof nickname !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: '昵称必须是字符串类型' 
        });
      }
      
      const trimmedNickname = nickname.trim();
      
      if (trimmedNickname.length > 20) {
        return res.status(400).json({ 
          success: false, 
          message: '昵称长度不能超过20个字符' 
        });
      }
      
      // 如果昵称为空字符串，设置为null
      const finalNickname = trimmedNickname === '' ? null : trimmedNickname;
      
      // 更新用户昵称
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { nickname: finalNickname },
        { 
          new: true, 
          runValidators: true,
          select: '-password' // 不返回密码
        }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在' 
        });
      }
      
      res.json({
        success: true,
        message: '用户信息更新成功',
        user: updatedUser
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '请提供要更新的昵称' 
      });
    }
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🆕 更新用户偏好设置
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { 
      theme, 
      language, 
      rememberMe, 
      showNicknamePrompt,
      sandboxMode
    } = req.body;
    
    const updateData = {};
    
    // 验证并设置主题偏好
    if (theme !== undefined) {
      if (!['light', 'dark', 'auto'].includes(theme)) {
        return res.status(400).json({
          success: false,
          message: '主题设置只能是 light、dark 或 auto'
        });
      }
      updateData['preferences.theme'] = theme;
    }
    
    // 验证并设置语言偏好
    if (language !== undefined) {
      if (typeof language !== 'string') {
        return res.status(400).json({
          success: false,
          message: '语言设置必须是字符串'
        });
      }
      updateData['preferences.language'] = language;
    }
    
    // 验证并设置记住登录偏好
    if (rememberMe !== undefined) {
      if (typeof rememberMe !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: '记住登录设置必须是布尔值'
        });
      }
      updateData['preferences.rememberMe'] = rememberMe;
    }
    
    // 验证并设置昵称提醒偏好
    if (showNicknamePrompt !== undefined) {
      if (typeof showNicknamePrompt !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: '昵称提醒设置必须是布尔值'
        });
      }
      updateData['preferences.showNicknamePrompt'] = showNicknamePrompt;
    }

    // 🚫 验证并设置沙盒模式偏好（仅教师端可用）
  if (sandboxMode !== undefined) {
    if (typeof sandboxMode !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '沙盒模式设置必须是布尔值'
      });
    }
    
    // 🚫 安全检查：只有教师角色才能启用沙盒模式
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    if (currentUser.role !== 'teacher' && sandboxMode === true) {
      return res.status(403).json({
        success: false,
        message: '只有教师角色才能启用沙盒模式'
      });
    }
    
    updateData['preferences.sandboxMode'] = sandboxMode;
  }


    
    // 如果没有要更新的数据
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要更新的偏好设置'
      });
    }
    
    // 更新用户偏好
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        select: '-password' // 不返回密码
      }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '偏好设置更新成功',
      user: updatedUser
    });
    
  } catch (err) {
    console.error('更新用户偏好失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🆕 快速设置昵称（便捷接口）
router.patch('/nickname', verifyToken, async (req, res) => {
  try {
    const { nickname } = req.body;
    
    if (nickname === undefined) {
      return res.status(400).json({
        success: false,
        message: '请提供昵称'
      });
    }
    
    let finalNickname = null;
    
    if (nickname !== null) {
      if (typeof nickname !== 'string') {
        return res.status(400).json({
          success: false,
          message: '昵称必须是字符串类型'
        });
      }
      
      const trimmedNickname = nickname.trim();
      
      if (trimmedNickname.length > 20) {
        return res.status(400).json({
          success: false,
          message: '昵称长度不能超过20个字符'
        });
      }
      
      finalNickname = trimmedNickname === '' ? null : trimmedNickname;
    }
    
    // 使用便捷方法更新昵称
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    await user.setNickname(finalNickname);
    
    // 获取更新后的用户信息（不包含密码）
    const updatedUser = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      message: finalNickname ? '昵称设置成功' : '昵称已清空',
      user: updatedUser
    });
    
  } catch (err) {
    console.error('设置昵称失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🆕 禁用昵称提醒（便捷接口）
router.patch('/disable-nickname-prompt', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    await user.disableNicknamePrompt();
    
    // 获取更新后的用户信息（不包含密码）
    const updatedUser = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      message: '昵称提醒已禁用',
      user: updatedUser
    });
    
  } catch (err) {
    console.error('禁用昵称提醒失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🆕 获取用户统计信息（可选）
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    const stats = {
      hasNickname: !!user.nickname,
      displayName: user.nickname || user.email.split('@')[0],
      accountAge: Date.now() - user.createdAt.getTime(),
      lastLogin: user.security?.lastLoginAt || null,
      preferences: user.preferences
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (err) {
    console.error('获取用户统计失败:', err);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// ✅ 模拟登出接口（前端只需删掉 token）
router.post('/logout', (req, res) => {
  res.json({ message: '登出成功，请清除前端 token' });
});

module.exports = router;