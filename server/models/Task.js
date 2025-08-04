//server/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['课堂练习', '课程任务'], default: '课程任务' },
  // 作业文件是否为必交
  needsFile: { type: Boolean, default: false },
  allowAIGC: { type: Boolean, default: true },
  requireAIGCLog: { type: Boolean, default: false },
  // 📌 升级：deadline 改为必填，并精确到分钟
  deadline: { 
    type: Date, 
    required: true 
  },
  // 📌 新增：是否允许逾期提交
  allowLateSubmission: { 
    type: Boolean, 
    default: false 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
});

module.exports = mongoose.model('Task', taskSchema);