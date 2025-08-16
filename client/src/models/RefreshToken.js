// server/models/RefreshToken.js - 创建缺失的模型

const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  rememberMe: {
    type: Boolean,
    default: false
  },
  // 安全相关字段
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// 自动清理过期的token
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 复合索引优化查询
RefreshTokenSchema.index({ 
  userId: 1, 
  isRevoked: 1, 
  expiresAt: 1 
});

// 实例方法：检查token是否有效
RefreshTokenSchema.methods.isValid = function() {
  return !this.isRevoked && this.expiresAt > new Date();
};

// 静态方法：清理过期token
RefreshTokenSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true }
    ]
  });
  
  console.log(`🧹 清理了 ${result.deletedCount} 个过期的refresh token`);
  return result;
};

// 静态方法：撤销用户的所有token
RefreshTokenSchema.statics.revokeAllForUser = async function(userId) {
  const result = await this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
  
  console.log(`🔒 撤销了用户 ${userId} 的 ${result.modifiedCount} 个refresh token`);
  return result;
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);