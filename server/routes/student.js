//server/routes/student.js
const express = require('express');
const router = express.Router();
const ClassModel = require('../models/Class');
const verifyToken = require('../middleware/auth'); // ✅ 使用你已有的 auth 中间件

// ✅ 让所有接口都走身份校验
router.use(verifyToken);

router.post('/join-class', async (req, res) => {
  const { inviteCode, name, studentId } = req.body;
  const userId = req.user.id; // 取自 token 中间件解码后的用户ID

  if (!inviteCode || !name || !studentId) {
    return res.status(400).json({ message: '请填写全部信息' });
  }

  // 1. 查找班级
  const klass = await ClassModel.findOne({ inviteCode });
  if (!klass) {
    return res.status(404).json({ message: '邀请码无效' });
  }

  // 2. 检查学生是否存在于 CSV 导入数据中
  const matched = klass.students.find(
    (s) => s.name === name && s.studentId === studentId
  );
  if (!matched) {
    return res.status(403).json({ message: '学生信息不匹配，请检查姓名与学号' });
  }

  // 3. 检查是否已加入
  const alreadyJoined = klass.joinedStudents.some(
    (s) => String(s.userId) === String(userId)
  );
  if (alreadyJoined) {
    return res
      .status(200)
      .json({ message: '✅ 已经加入过班级', className: klass.name });
  }

  // 4. 加入班级
  klass.joinedStudents.push({ userId, name, studentId });
  await klass.save();

  res.status(200).json({ message: '✅ 加入成功', className: klass.name });
});

module.exports = router;
