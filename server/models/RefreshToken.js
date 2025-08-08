// server/models/RefreshToken.js

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  rememberMe: {
    type: Boolean,
    default: false
  },
  // 设备信息（可选，用于多设备管理）
  deviceInfo: {
    userAgent: String,
    ip: String,
    deviceName: String
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 自动删除过期token
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 清理被撤销的token（定期任务）
refreshTokenSchema.index({ isRevoked: 1, createdAt: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);