// server/models/Class.js

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedAt: { type: Date, default: null },
  // 📌 新增：软删除相关字段
  isRemoved: { type: Boolean, default: false },
  removedAt: { type: Date, default: null },
  removedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // 📌 新增：信息修改历史
  modificationHistory: [{
    oldName: String,
    oldStudentId: String,
    newName: String,
    newStudentId: String,
    modifiedAt: { type: Date, default: Date.now },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { _id: false });

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviteCode: { type: String, required: true, unique: true },
  studentList: [studentSchema],
  createdAt: { type: Date, default: Date.now },
  // 📌 新增：班级编辑历史
  editHistory: [{
    action: { type: String, enum: ['add_student', 'remove_student', 'modify_student', 'restore_student', 'modify_students', 'remove_students'] },
    details: Object,
    editedAt: { type: Date, default: Date.now },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class;