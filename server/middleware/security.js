// server/middleware/security.js

const rateLimit = require('express-rate-limit');

const User = require('../models/User');

// 登录频率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  max: 5, // 最多5次尝试
  message: {
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API频率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000次请求
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// 密码重置频率限制
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 每小时最多3次密码重置请求
  message: {
    error: 'Too many password reset attempts, please try again later.'
  }
});

// 检查用户账户状态
const checkAccountStatus = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next();

    const user = await User.findOne({ email });
    if (!user) return next();

    // 检查账户状态
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        message: '账户已被暂停，请联系管理员' 
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ 
        message: '账户未激活，请检查邮件激活账户' 
      });
    }

    // 检查账户锁定状态
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.security.lockedUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({ 
        message: `账户已被锁定，请在 ${lockTimeRemaining} 分钟后再试` 
      });
    }

    req.user = user; // 将用户信息传递给下一个中间件
    next();
  } catch (error) {
    console.error('检查账户状态失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// IP地址提取中间件
const extractClientInfo = (req, res, next) => {
  // 提取真实IP地址
  const clientIp = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);

  req.clientInfo = {
    ip: clientIp,
    userAgent: req.headers['user-agent'],
    // 简单的设备类型检测
    deviceType: /Mobile|Android|iPhone/.test(req.headers['user-agent']) ? 'mobile' : 'desktop'
  };

  next();
};

// 可疑活动检测
const suspiciousActivityDetection = async (req, res, next) => {
  try {
    const { clientInfo } = req;
    const { email } = req.body;

    if (!email || !clientInfo) return next();

    // 检查是否有来自多个不同IP的登录尝试
    const recentLoginAttempts = await User.aggregate([
      {
        $match: {
          email,
          'security.recentLoginIPs.timestamp': {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
          }
        }
      },
      {
        $unwind: '$security.recentLoginIPs'
      },
      {
        $group: {
          _id: '$security.recentLoginIPs.ip',
          count: { $sum: 1 }
        }
      }
    ]);

    // 如果24小时内有超过3个不同IP尝试登录，标记为可疑
    if (recentLoginAttempts.length > 3) {
      console.log(`⚠️ 可疑登录活动检测: ${email} 在24小时内从 ${recentLoginAttempts.length} 个不同IP尝试登录`);
      
      // 可以选择发送邮件通知或额外的安全验证
      // 这里先记录日志
    }

    next();
  } catch (error) {
    console.error('可疑活动检测失败:', error);
    next(); // 不阻断流程
  }
};

// 记录登录历史
const recordLoginHistory = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // 只在成功响应时记录
    if (res.statusCode === 200 && req.user && req.clientInfo) {
      // 异步记录，不阻塞响应
      setImmediate(async () => {
        try {
          await User.findByIdAndUpdate(req.user._id, {
            $set: {
              'security.lastLoginAt': new Date(),
              'security.lastLoginIP': req.clientInfo.ip
            },
            $push: {
              'security.recentLoginIPs': {
                $each: [{
                  ip: req.clientInfo.ip,
                  userAgent: req.clientInfo.userAgent,
                  timestamp: new Date()
                }],
                $slice: -10 // 只保留最近10次
              }
            }
          });
        } catch (error) {
          console.error('记录登录历史失败:', error);
        }
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// 内容安全策略
const securityHeaders = (req, res, next) => {
  // 设置安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP策略
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.potacademy.net",
    "frame-ancestors 'none'"
  ].join('; '));
  
  next();
};

module.exports = {
  loginLimiter,
  apiLimiter,
  passwordResetLimiter,
  checkAccountStatus,
  extractClientInfo,
  suspiciousActivityDetection,
  recordLoginHistory,
  securityHeaders
};