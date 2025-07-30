const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['课堂练习', '课程任务'], default: '课程任务' },
  allowAIGC: { type: Boolean, default: true },
  requireAIGCLog: { type: Boolean, default: false },
  deadline: {type: Date},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
});

module.exports = mongoose.model('Task', taskSchema);
