//server/routes/task.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const verifyToken = require('../middleware/auth');
const Class = require('../models/Class');

// 📌 导入任务管理控制器
const {
  archiveTask,
  unarchiveTask,
  updateArchivedTaskStudentPermission,
  softDeleteTask,
  restoreTask,
  hardDeleteTask,
  batchOperateTasks,
  getDeletedTasks
} = require('../controllers/taskManagementController');

// ✅ 发布任务（仅限教师）
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权限发布任务' });
    }

    // 📌 修改：增加 allowLateSubmission 字段
    const { 
      title, 
      description, 
      category, 
      allowAIGC, 
      requireAIGCLog, 
      needsFile, 
      deadline, 
      allowLateSubmission, // 📌 新增
      classIds 
    } = req.body;

    // 📌 新增：验证截止时间
    if (!deadline) {
      return res.status(400).json({ message: '截止时间不能为空' });
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (deadlineDate <= now) {
      return res.status(400).json({ message: '截止时间必须晚于当前时间' });
    }

    const task = new Task({
      title,
      description,
      category,
      allowAIGC,
      requireAIGCLog,
      needsFile,
      deadline: deadlineDate,
      allowLateSubmission: allowLateSubmission || false, // 📌 新增
      createdBy: req.user.id,
      classIds,
    });

    await task.save();
    res.status(201).json({ message: '任务发布成功', task });
  } catch (err) {
    console.error('发布任务失败:', err);
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// ✅ 获取当前教师发布的任务（📌 更新：支持分类获取）
router.get('/mine', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权限查看任务' });
    }

    const { category = 'active' } = req.query; // active, archived, deleted
    let filter = { createdBy: req.user.id };

    switch (category) {
      case 'active':
        filter.isArchived = false;
        filter.isDeleted = false;
        break;
      case 'archived':
        filter.isArchived = true;
        filter.isDeleted = false;
        break;
      case 'deleted':
        filter.isDeleted = true;
        break;
      default:
        // 获取所有未删除的任务（包括归档）
        filter.isDeleted = false;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    
    // 📌 新增：为已删除任务计算剩余天数
    if (category === 'deleted') {
      const tasksWithDaysLeft = tasks.map(task => {
        const deletedDate = new Date(task.deletedAt);
        const now = new Date();
        const daysPassed = Math.floor((now - deletedDate) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, 30 - daysPassed);
        
        return {
          ...task.toObject(),
          daysLeft,
          willBeDeletedAt: new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        };
      });
      return res.json(tasksWithDaysLeft);
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 学生获取所有可用任务（📌 更新：支持归档任务处理）
router.get('/all', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: '仅限学生访问任务列表' });
    }

    const { category = 'active' } = req.query; // active, archived

    const myClasses = await Class.find({
      'studentList.userId': req.user.id
    });

    const joinedClassIds = myClasses.map(cls => cls._id);

    let filter = {
      classIds: { $in: joinedClassIds },
      isDeleted: false // 学生端永远不显示已删除任务
    };

    if (category === 'active') {
      filter.isArchived = false;
    } else if (category === 'archived') {
      filter.isArchived = true;
      filter.allowStudentViewWhenArchived = true; // 只显示允许学生查看的归档任务
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 })
      .populate('createdBy', 'email')
      .populate('classIds', 'name');

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ✅ 获取单个任务详情（学生提交作业页）
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: '任务不存在' });
    
    // 📌 新增：对学生的权限检查
    if (req.user.role === 'student') {
      // 检查是否已删除
      if (task.isDeleted) {
        return res.status(404).json({ message: '任务不存在' });
      }
      
      // 检查归档权限
      if (task.isArchived && !task.allowStudentViewWhenArchived) {
        return res.status(403).json({ message: '无权限查看此任务' });
      }
    }
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 📌 新增：获取任务的班级提交情况
router.get('/:id/class-status', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: '无权限查看班级提交情况' });
    }

    const task = await Task.findById(req.params.id).populate('classIds', 'name studentList');
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    // 验证是否是任务创建者
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: '无权限查看此任务的提交情况' });
    }

    const Submission = require('../models/Submission');
    
    // 获取所有提交记录
    const submissions = await Submission.find({ task: req.params.id }).populate('student', 'email');
    
    // 构建提交映射
    const submissionMap = {};
    submissions.forEach(sub => {
      if (sub.student && sub.student._id) {
        submissionMap[sub.student._id.toString()] = {
          submitted: true,
          submittedAt: sub.submittedAt,
          isLateSubmission: sub.isLateSubmission,
          lateMinutes: sub.lateMinutes || 0
        };
      }
    });

    // 构建班级状态
    const classStatusList = task.classIds.map(classData => {
      const students = classData.studentList.map(student => {
        const userId = student.userId ? student.userId.toString() : null;
        const submissionInfo = userId ? submissionMap[userId] : null;
        
        return {
          name: student.name,
          studentId: student.studentId,
          userId: student.userId,
          hasJoined: !!student.userId,
          ...submissionInfo,
          submitted: !!submissionInfo
        };
      });

      const totalStudents = students.length;
      const joinedStudents = students.filter(s => s.hasJoined).length;
      const submittedStudents = students.filter(s => s.submitted).length;
      const lateSubmissions = students.filter(s => s.submitted && s.isLateSubmission).length;

      return {
        classId: classData._id,
        className: classData.name,
        totalStudents,
        joinedStudents,
        submittedStudents,
        lateSubmissions,
        students: students.sort((a, b) => a.studentId.localeCompare(b.studentId))
      };
    });

    res.json({
      success: true,
      task: {
        title: task.title,
        deadline: task.deadline,
        allowLateSubmission: task.allowLateSubmission
      },
      classStatus: classStatusList
    });
  } catch (err) {
    console.error('获取班级提交情况失败:', err);
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// 📌 新增：任务管理路由
// 归档任务
router.post('/:taskId/archive', verifyToken, archiveTask);

// 恢复归档任务
router.post('/:taskId/unarchive', verifyToken, unarchiveTask);

// 更新归档任务的学生查看权限
router.put('/:taskId/student-permission', verifyToken, updateArchivedTaskStudentPermission);

// 软删除任务
router.delete('/:taskId/soft', verifyToken, softDeleteTask);

// 恢复任务
router.post('/:taskId/restore', verifyToken, restoreTask);

// 硬删除任务
router.delete('/:taskId/hard', verifyToken, hardDeleteTask);

// 批量操作任务
router.post('/batch', verifyToken, batchOperateTasks);

// 获取回收站任务列表
router.get('/management/deleted', verifyToken, getDeletedTasks);

module.exports = router;