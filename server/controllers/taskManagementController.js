// server/controllers/taskManagementController.js

const Task = require('../models/Task');
const Submission = require('../models/Submission');

// 归档任务
const archiveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { allowStudentViewWhenArchived = true } = req.body;
    const teacherId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    // 验证权限：只有任务创建者可以归档
    if (task.createdBy.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有任务创建者可以归档任务' });
    }

    // 检查任务状态
    if (task.isDeleted) {
      return res.status(400).json({ success: false, message: '已删除的任务无法归档' });
    }

    if (task.isArchived) {
      return res.status(400).json({ success: false, message: '任务已处于归档状态' });
    }

    // 归档任务
    task.isArchived = true;
    task.archivedAt = new Date();
    task.archivedBy = teacherId;
    task.allowStudentViewWhenArchived = allowStudentViewWhenArchived;

    // 记录操作历史
    task.operationHistory.push({
      action: 'archive',
      performedBy: teacherId,
      details: {
        allowStudentViewWhenArchived,
        message: '任务已归档'
      }
    });

    await task.save();

    res.json({
      success: true,
      message: '任务归档成功',
      task: {
        _id: task._id,
        title: task.title,
        isArchived: task.isArchived,
        allowStudentViewWhenArchived: task.allowStudentViewWhenArchived
      }
    });
  } catch (err) {
    console.error('归档任务失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 恢复归档任务
const unarchiveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const teacherId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    // 验证权限
    if (task.createdBy.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有任务创建者可以恢复归档任务' });
    }

    if (!task.isArchived) {
      return res.status(400).json({ success: false, message: '任务未处于归档状态' });
    }

    // 恢复任务
    task.isArchived = false;
    task.archivedAt = null;
    task.archivedBy = null;
    task.allowStudentViewWhenArchived = true;

    // 记录操作历史
    task.operationHistory.push({
      action: 'unarchive',
      performedBy: teacherId,
      details: {
        message: '任务已恢复'
      }
    });

    await task.save();

    res.json({
      success: true,
      message: '任务恢复成功',
      task: {
        _id: task._id,
        title: task.title,
        isArchived: task.isArchived
      }
    });
  } catch (err) {
    console.error('恢复归档任务失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 更新归档任务的学生查看权限
const updateArchivedTaskStudentPermission = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { allowStudentViewWhenArchived } = req.body;
    const teacherId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    // 验证权限
    if (task.createdBy.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有任务创建者可以修改权限' });
    }

    if (!task.isArchived) {
      return res.status(400).json({ success: false, message: '只能修改已归档任务的权限' });
    }

    // 更新权限
    task.allowStudentViewWhenArchived = allowStudentViewWhenArchived;

    // 记录操作历史
    task.operationHistory.push({
      action: 'update_student_view_permission',
      performedBy: teacherId,
      details: {
        allowStudentViewWhenArchived,
        message: `学生查看权限已${allowStudentViewWhenArchived ? '开启' : '关闭'}`
      }
    });

    await task.save();

    res.json({
      success: true,
      message: '权限更新成功',
      allowStudentViewWhenArchived: task.allowStudentViewWhenArchived
    });
  } catch (err) {
    console.error('更新权限失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 软删除任务
const softDeleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const teacherId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    // 验证权限
    if (task.createdBy.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有任务创建者可以删除任务' });
    }

    if (task.isDeleted) {
      return res.status(400).json({ success: false, message: '任务已处于删除状态' });
    }

    // 软删除任务
    task.isDeleted = true;
    task.deletedAt = new Date();
    task.deletedBy = teacherId;

    // 记录操作历史
    task.operationHistory.push({
      action: 'soft_delete',
      performedBy: teacherId,
      details: {
        message: '任务已删除（30天内可恢复）'
      }
    });

    await task.save();

    res.json({
      success: true,
      message: '任务删除成功（30天内可恢复）',
      task: {
        _id: task._id,
        title: task.title,
        isDeleted: task.isDeleted,
        deletedAt: task.deletedAt
      }
    });
  } catch (err) {
    console.error('删除任务失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 恢复软删除任务
const restoreTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const teacherId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    // 验证权限
    if (task.createdBy.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有任务创建者可以恢复任务' });
    }

    if (!task.isDeleted) {
      return res.status(400).json({ success: false, message: '任务未处于删除状态' });
    }

    // 恢复任务
    task.isDeleted = false;
    task.deletedAt = null;
    task.deletedBy = null;

    // 记录操作历史
    task.operationHistory.push({
      action: 'restore',
      performedBy: teacherId,
      details: {
        message: '任务已恢复'
      }
    });

    await task.save();

    res.json({
      success: true,
      message: '任务恢复成功',
      task: {
        _id: task._id,
        title: task.title,
        isDeleted: task.isDeleted
      }
    });
  } catch (err) {
    console.error('恢复任务失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 硬删除任务
const hardDeleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const teacherId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    // 验证权限
    if (task.createdBy.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有任务创建者可以永久删除任务' });
    }

    const taskTitle = task.title;

    // 删除所有相关的提交记录
    await Submission.deleteMany({ task: taskId });

    // 硬删除任务
    await Task.findByIdAndDelete(taskId);

    res.json({
      success: true,
      message: `任务"${taskTitle}"及其所有提交记录已永久删除`
    });
  } catch (err) {
    console.error('硬删除任务失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 批量操作任务
const batchOperateTasks = async (req, res) => {
  try {
    const { taskIds, operation, options = {} } = req.body;
    const teacherId = req.user.id;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要操作的任务' });
    }

    const tasks = await Task.find({ 
      _id: { $in: taskIds },
      createdBy: teacherId // 确保只能操作自己创建的任务
    });

    if (tasks.length !== taskIds.length) {
      return res.status(403).json({ success: false, message: '部分任务不存在或无权限操作' });
    }

    let successCount = 0;
    const results = [];

    for (const task of tasks) {
      try {
        switch (operation) {
          case 'archive':
            if (!task.isDeleted && !task.isArchived) {
              task.isArchived = true;
              task.archivedAt = new Date();
              task.archivedBy = teacherId;
              task.allowStudentViewWhenArchived = options.allowStudentViewWhenArchived !== false;
              
              task.operationHistory.push({
                action: 'archive',
                performedBy: teacherId,
                details: { message: '批量归档', allowStudentViewWhenArchived: task.allowStudentViewWhenArchived }
              });
              
              await task.save();
              successCount++;
              results.push({ taskId: task._id, success: true, message: '归档成功' });
            } else {
              results.push({ taskId: task._id, success: false, message: '任务状态不允许归档' });
            }
            break;

          case 'unarchive':
            if (task.isArchived) {
              task.isArchived = false;
              task.archivedAt = null;
              task.archivedBy = null;
              task.allowStudentViewWhenArchived = true;
              
              task.operationHistory.push({
                action: 'unarchive',
                performedBy: teacherId,
                details: { message: '批量恢复归档' }
              });
              
              await task.save();
              successCount++;
              results.push({ taskId: task._id, success: true, message: '恢复成功' });
            } else {
              results.push({ taskId: task._id, success: false, message: '任务未处于归档状态' });
            }
            break;

          case 'soft_delete':
            if (!task.isDeleted) {
              task.isDeleted = true;
              task.deletedAt = new Date();
              task.deletedBy = teacherId;
              
              task.operationHistory.push({
                action: 'soft_delete',
                performedBy: teacherId,
                details: { message: '批量删除' }
              });
              
              await task.save();
              successCount++;
              results.push({ taskId: task._id, success: true, message: '删除成功' });
            } else {
              results.push({ taskId: task._id, success: false, message: '任务已处于删除状态' });
            }
            break;

          case 'restore':
            if (task.isDeleted) {
              task.isDeleted = false;
              task.deletedAt = null;
              task.deletedBy = null;
              
              task.operationHistory.push({
                action: 'restore',
                performedBy: teacherId,
                details: { message: '批量恢复' }
              });
              
              await task.save();
              successCount++;
              results.push({ taskId: task._id, success: true, message: '恢复成功' });
            } else {
              results.push({ taskId: task._id, success: false, message: '任务未处于删除状态' });
            }
            break;

          case 'hard_delete':
            if (task.isDeleted) {
              await Submission.deleteMany({ task: task._id });
              await Task.findByIdAndDelete(task._id);
              successCount++;
              results.push({ taskId: task._id, success: true, message: '永久删除成功' });
            } else {
              results.push({ taskId: task._id, success: false, message: '只能永久删除软删除状态的任务' });
            }
            break;

          default:
            results.push({ taskId: task._id, success: false, message: '不支持的操作类型' });
        }
      } catch (error) {
        results.push({ taskId: task._id, success: false, message: error.message });
      }
    }

    res.json({
      success: true,
      message: `批量操作完成，成功处理 ${successCount}/${taskIds.length} 个任务`,
      successCount,
      totalCount: taskIds.length,
      results
    });
  } catch (err) {
    console.error('批量操作任务失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取回收站任务列表
const getDeletedTasks = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const deletedTasks = await Task.find({
      createdBy: teacherId,
      isDeleted: true
    }).sort({ deletedAt: -1 });

    // 计算剩余天数
    const tasksWithDaysLeft = deletedTasks.map(task => {
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

    res.json({
      success: true,
      tasks: tasksWithDaysLeft
    });
  } catch (err) {
    console.error('获取回收站任务失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 📌 新增：定期清理30天前的软删除任务（硬删除）
const cleanupDeletedTasks = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasksToDelete = await Task.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo }
    });

    let cleanedCount = 0;

    for (const task of tasksToDelete) {
      // 删除相关提交记录
      await Submission.deleteMany({ task: task._id });
      // 硬删除任务
      await Task.findByIdAndDelete(task._id);
      cleanedCount++;
    }

    console.log(`任务清理完成：硬删除了 ${cleanedCount} 个30天前被软删除的任务`);
    return cleanedCount;

  } catch (err) {
    console.error('清理软删除任务失败:', err);
    throw err;
  }
};

module.exports = {
  archiveTask,
  unarchiveTask,
  updateArchivedTaskStudentPermission,
  softDeleteTask,
  restoreTask,
  hardDeleteTask,
  batchOperateTasks,
  getDeletedTasks,
  cleanupDeletedTasks
};