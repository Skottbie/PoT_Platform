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
  // 📌 修改：支持文本内容
  content: { 
    type: String, 
    default: '' 
  },
  // 📌 新增：支持多张图片
  imageIds: [{ 
    type: String 
  }],
  // 📌 修改：作业文件变为可选
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
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Submission', submissionSchema);
