// server/models/Submission.js

const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  // 任务 ID，引用 Task 模型
  task: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  // 学生 ID，引用 User 模型
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // 📌 修改：存储文件在 GridFS 中的 ID
  fileId: { 
    type: String, 
    required: true 
  },
  // 📌 新增：存储文件的原始名称
  fileName: { 
    type: String, 
    required: true 
  },
  // 📌 修改：存储 AIGC 日志在 GridFS 中的 ID（可选）
  aigcLogId: { 
    type: String,
    default: null
  },
  // 提交时间
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Submission', submissionSchema);