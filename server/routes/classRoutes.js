
/* ver1.0
const express = require('express');
const multer = require('multer');
const { createClass } = require('../controllers/classController');
const  verifyToken  = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /class/create
router.post('/create', verifyToken, upload.single('studentList'), createClass);

module.exports = router;
*/

// server/routes/classRoutes.js
const express = require('express');
const multer = require('multer');
const { createClass, getMyClasses, getClassById, joinClass, } = require('../controllers/classController'); // 导入控制器函数
const verifyToken = require('../middleware/auth'); // 你的认证中间件

const router = express.Router();

// multer 配置：如果你想让文件保存到磁盘并获取 filePath，就用 dest
// 如果你想在内存中处理文件（即 req.file.buffer），就用 memoryStorage()
// 鉴于你当前的 classController.js 是从 req.file.buffer 处理的，这里保持 memoryStorage() 是没问题的
const upload = multer({ storage: multer.memoryStorage() }); 

// 班级创建路由
// 注意：如果你的认证中间件是 requireLogin 和 requireRole，你需要修改这里
// router.post('/create', requireLogin, requireRole('teacher'), upload.single('studentList'), createClass);
// 目前你用的是 verifyToken，就保持它
router.post('/create', verifyToken, upload.single('studentList'), createClass);

router.get('/my-classes', verifyToken, getMyClasses);
router.get('/:id', verifyToken, getClassById); 
router.post('/join', verifyToken, joinClass); // 👈 需要登录后才能加入


module.exports = router;