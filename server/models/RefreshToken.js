// server/models/RefreshToken.js
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
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 自动清理过期token
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 复合索引优化查询
RefreshTokenSchema.index({ 
  userId: 1, 
  isRevoked: 1, 
  expiresAt: 1 
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);