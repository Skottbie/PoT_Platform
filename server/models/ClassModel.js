const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [
    {
      name: String,
      studentId: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 预留字段：加入后绑定
    },
  ],
  inviteCode: {
  type: String,
  unique: true,
  required: true
},

}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
