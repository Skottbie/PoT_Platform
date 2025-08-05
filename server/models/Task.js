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
  
  // 📌 新增：归档相关字段
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  allowStudentViewWhenArchived: { type: Boolean, default: true }, // 归档后是否允许学生查看
  
  // 📌 新增：软删除相关字段
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // 📌 新增：操作历史记录
  operationHistory: [{
    action: { 
      type: String, 
      enum: ['archive', 'unarchive', 'soft_delete', 'restore', 'hard_delete', 'update_student_view_permission'] 
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedAt: { type: Date, default: Date.now },
    details: Object // 存储操作的详细信息
  }]
});

module.exports = mongoose.model('Task', taskSchema);