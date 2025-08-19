// server/models/User.js - 更新版本（添加昵称支持）

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },
  
  // 🆕 新增：用户昵称
  nickname: {
    type: String,
    trim: true,
    maxlength: 20,
    default: null
  },
  
  // 📌 新增：token版本控制，用于全局登出
  tokenVersion: {
    type: Number,
    default: 0
  },
  
  // 📌 新增：用户偏好设置
  preferences: {
    rememberMe: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'zh-CN'
    },
    // 🆕 新增：欢迎词相关偏好
    showNicknamePrompt: {
      type: Boolean,
      default: true  // 新用户默认显示昵称设置提醒
    }
  },
  
  // 📌 新增：安全相关字段
  security: {
    lastLoginAt: Date,
    lastLoginIP: String,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: Date,
    passwordChangedAt: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    }
  },
  
  // 📌 新增：用户状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 虚拟字段：检查账户是否被锁定
UserSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockedUntil && this.security.lockedUntil > Date.now());
});

// 🆕 虚拟字段：获取显示名称（昵称优先，否则使用邮箱前缀）
UserSchema.virtual('displayName').get(function() {
  return this.nickname || this.email.split('@')[0];
});

// 账户锁定逻辑
UserSchema.methods.incrementLoginAttempts = function() {
  // 如果已经锁定且锁定时间已过，重置计数
  if (this.security.lockedUntil && this.security.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockedUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // 如果达到最大尝试次数且未锁定，则锁定账户
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      'security.lockedUntil': Date.now() + 2 * 60 * 60 * 1000 // 锁定2小时
    };
  }
  
  return this.updateOne(updates);
};

// 登录成功后重置计数
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      'security.loginAttempts': 1,
      'security.lockedUntil': 1
    },
    $set: {
      'security.lastLoginAt': new Date(),
      'security.lastLoginIP': this.security.lastLoginIP
    }
  });
};

// 🆕 设置昵称的便捷方法
UserSchema.methods.setNickname = function(nickname) {
  this.nickname = nickname ? nickname.trim() : null;
  return this.save();
};

// 🆕 禁用昵称提醒的便捷方法
UserSchema.methods.disableNicknamePrompt = function() {
  this.preferences.showNicknamePrompt = false;
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);