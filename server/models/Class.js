// server/models/Class.js

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedAt: { type: Date, default: null }
}, { _id: false });

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviteCode: { type: String, required: true, unique: true },
  studentList: [studentSchema],
  createdAt: { type: Date, default: Date.now }
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class; // ✅ 关键：改成 CommonJS 导出
