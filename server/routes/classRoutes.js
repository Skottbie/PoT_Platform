// server/routes/classRoutes.js
const express = require('express');
const multer = require('multer');
const { 
  createClass, 
  getMyClasses, 
  getClassById, 
  joinClass,
  updateClassStudents,    // 📌 新增
  removeClassStudents     // 📌 新增
} = require('../controllers/classController');
const verifyToken = require('../middleware/auth');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }); 

// 班级创建路由
router.post('/create', verifyToken, upload.single('studentList'), createClass);

// 获取教师的班级列表
router.get('/my-classes', verifyToken, getMyClasses);

// 获取班级详情
router.get('/:id', verifyToken, getClassById); 

// 学生加入班级
router.post('/join', verifyToken, joinClass);

// 📌 新增：更新班级学生信息
router.put('/:id/students', verifyToken, updateClassStudents);

// 📌 新增：移除班级学生（软删除）
router.delete('/:id/students', verifyToken, removeClassStudents);

module.exports = router;