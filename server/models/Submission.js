// server/models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  task: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    default: '' 
  },
  imageIds: [{ 
    type: String 
  }],
  fileId: { 
    type: String, 
    default: null 
  },
  fileName: { 
    type: String, 
    default: null 
  },
  aigcLogId: { 
    type: String,
    default: null
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  isLateSubmission: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  // 📌 新增：教师反馈字段
  feedback: {
    content: { type: String, default: '' }, // 反馈内容
    rating: { type: Number, min: 1, max: 5, default: null }, // 评分 1-5星
    createdAt: { type: Date, default: null }, // 反馈时间
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // 反馈教师
    updatedAt: { type: Date, default: null } // 最后更新时间
  },
  // 🆕 PoT模式相关字段
  potModeData: {
    hasPotMode: { type: Boolean, default: false },
    potMessages: { type: Number, default: 0 },
    normalMessages: { type: Number, default: 0 },
    detectedAt: { type: Date, default: Date.now }
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Submission', submissionSchema);