// server/controllers/classController.js

const csvParser = require('csv-parser');
const { Readable } = require('stream');
const ClassModel = require('../models/Class');

// ✅ 生成唯一邀请码
async function generateUniqueInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let attempts = 0;
    while (attempts < 10) {
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        console.log(`DEBUG: 尝试生成邀请码(${attempts + 1}):`, code);
        try {
            const found = await ClassModel.findOne({ inviteCode: code });
            if (!found) {
                console.log('DEBUG: 邀请码未重复，使用:', code);
                return code;
            } else {
                console.log('DEBUG: 邀请码重复，继续尝试');
            }
        } catch (err) {
            console.error('DEBUG: 数据库查询邀请码出错:', err);
            throw err;
        }
        attempts++;
    }
    console.error('DEBUG: ❌ 所有邀请码都重复，未能生成');
    throw new Error('邀请码生成失败，尝试次数过多');
}

// 创建班级
const createClass = async (req, res) => {
    console.log('DEBUG: 进入 createClass 控制器');
    try {
        console.log('DEBUG: req.body:', req.body);
        console.log('DEBUG: req.user:', req.user); 
        console.log('DEBUG: req.file:', req.file);

        const { name, description } = req.body;
        const teacherId = req.user?.id;

        if (!teacherId) {
            console.error('DEBUG: 认证信息缺失或无效，teacherId 为空');
            return res.status(401).json({ success: false, message: '认证失败，教师ID缺失。请确保已登录并具有教师权限。' });
        }

        if (!req.file) {
            console.error('DEBUG: 未上传学生名单文件');
            return res.status(400).json({ success: false, message: '未上传学生名单文件' });
        }

        const students = [];

        await new Promise((resolve, reject) => {
            const stream = Readable.from(req.file.buffer.toString());
            stream
                .pipe(csvParser())
                .on('data', (row) => {
                    console.log('DEBUG: 📄 CSV原始行:', row);

                    const cleanRow = {};
                    Object.keys(row).forEach((key) => {
                        const cleanKey = key.replace(/^\uFEFF/, '');
                        cleanRow[cleanKey] = row[key];
                    });
                    
                    const studentName = cleanRow.name;
                    const studentId = cleanRow.studentId;

                    if (studentName && studentId) {
                        students.push({
                            name: studentName.trim(),
                            studentId: studentId.trim(),
                        });
                        console.log('DEBUG: ✅ 添加学生:', { name: studentName.trim(), studentId: studentId.trim() });
                    } else {
                        console.warn('DEBUG: ⚠️ 无效 CSV 行 (缺少 name 或 studentId):', cleanRow);
                    }
                })
                .on('end', () => {
                    console.log('DEBUG: ✅ CSV 解析完成，学生列表:', students);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('DEBUG: ❌ CSV 解析失败：', err);
                    reject(err);
                });
        });

        console.log('DEBUG: 准备生成邀请码...');
        const inviteCode = await generateUniqueInviteCode();
        console.log('DEBUG: ✅ 生成的邀请码:', inviteCode);

        const newClass = new ClassModel({
            name,
            description,
            teacherId: teacherId,
            inviteCode: inviteCode,
            studentList: students,
        });

        console.log('DEBUG: 🆕 准备保存的新班级:', newClass);

        await newClass.save();

        console.log('DEBUG: 🎉 班级保存成功');
        res.status(201).json({
            success: true,
            message: '班级创建成功',
            classId: newClass._id,
            inviteCode: inviteCode,
        });

    } catch (err) {
        console.error('DEBUG: ❌ 创建班级失败 (捕获到错误):', err);
        if (err.name === 'ValidationError') {
            console.error('DEBUG: Mongoose 验证错误详情:', err.errors);
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: '数据验证失败', details: errors });
        } else if (err.message.includes('邀请码生成失败')) {
            return res.status(500).json({ success: false, message: '班级创建失败：无法生成唯一邀请码' });
        }
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

// 获取教师的班级列表
const getMyClasses = async (req, res) => {
  try {
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    const classes = await ClassModel.find({ teacherId });

    res.json({
      success: true,
      classes,
    });
  } catch (err) {
    console.error('获取班级列表失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取班级详情
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await ClassModel.findById(id);

    if (!classData) {
      return res.status(404).json({ success: false, message: '班级不存在' });
    }

    res.json({ success: true, class: classData });
  } catch (err) {
    console.error('获取班级详情失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 学生加入班级
const joinClass = async (req, res) => {
  const { inviteCode, studentId, name } = req.body;
  const userId = req.user?.id;

  if (!inviteCode || !studentId || !name) {
    return res.status(400).json({ success: false, message: '缺少必要字段' });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: '未登录或权限异常' });
  }

  try {
    const classDoc = await ClassModel.findOne({ inviteCode });

    if (!classDoc) {
      return res.status(404).json({ success: false, message: '邀请码错误，班级不存在' });
    }

    const student = classDoc.studentList.find(
      (s) => s.studentId === studentId && s.name === name && !s.isRemoved
    );

    if (!student) {
      return res.status(400).json({ success: false, message: '学生信息不匹配' });
    }

    if (student.userId) {
      return res.status(409).json({ success: false, message: '你已经加入过该班级' });
    }

    student.userId = userId;
    student.joinedAt = new Date();

    await classDoc.save();

    return res.status(200).json({ success: true, message: '加入班级成功', classId: classDoc._id });
  } catch (err) {
    console.error('加入班级失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 📌 新增：更新班级学生信息
const updateClassStudents = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { modifiedStudents, newStudents } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: '班级不存在' });
    }

    // 验证权限：只有班级创建者可以编辑
    if (classDoc.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有班级创建者可以编辑学生信息' });
    }

    const Submission = require('../models/Submission');
    const User = require('../models/User');

    // 处理修改的学生信息
    if (modifiedStudents && modifiedStudents.length > 0) {
      for (const modifiedStudent of modifiedStudents) {
        const student = classDoc.studentList.find(s => 
          s.studentId === modifiedStudent.originalId || s._id?.toString() === modifiedStudent.originalId
        );
        
        if (student && !student.isRemoved) {
          // 记录修改历史
          if (student.name !== modifiedStudent.name || student.studentId !== modifiedStudent.studentId) {
            student.modificationHistory.push({
              oldName: student.name,
              oldStudentId: student.studentId,
              newName: modifiedStudent.name,
              newStudentId: modifiedStudent.studentId,
              modifiedAt: new Date(),
              modifiedBy: teacherId
            });

            // 如果学生已加入（有userId），需要同步更新相关提交记录
            if (student.userId) {
              try {
                // 更新提交记录中的学生信息引用
                await Submission.updateMany(
                  { student: student.userId },
                  { 
                    $set: { 
                      'studentInfo.name': modifiedStudent.name,
                      'studentInfo.studentId': modifiedStudent.studentId,
                      'lastModified': new Date()
                    }
                  }
                );
              } catch (updateError) {
                console.error('更新提交记录失败:', updateError);
                // 继续执行，不阻断整个流程
              }
            }

            // 更新学生信息
            student.name = modifiedStudent.name;
            student.studentId = modifiedStudent.studentId;
          }
        }
      }
    }

    // 处理新增的学生
    if (newStudents && newStudents.length > 0) {
      for (const newStudent of newStudents) {
        if (newStudent.name.trim() && newStudent.studentId.trim()) {
          classDoc.studentList.push({
            name: newStudent.name.trim(),
            studentId: newStudent.studentId.trim(),
            userId: null,
            joinedAt: null,
            isRemoved: false
          });
        }
      }
    }

    // 记录编辑历史
    classDoc.editHistory.push({
      action: 'modify_students',
      details: {
        modifiedCount: modifiedStudents?.length || 0,
        addedCount: newStudents?.filter(s => s.name.trim() && s.studentId.trim()).length || 0
      },
      editedAt: new Date(),
      editedBy: teacherId
    });

    await classDoc.save();

    res.json({
      success: true,
      message: '学生信息更新成功',
      modifiedCount: modifiedStudents?.length || 0,
      addedCount: newStudents?.filter(s => s.name.trim() && s.studentId.trim()).length || 0
    });

  } catch (err) {
    console.error('更新班级学生失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '更新失败：' + (err.message || '服务器错误') 
    });
  }
};

// 📌 新增：移除班级学生（软删除）
const removeClassStudents = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { studentsToRemove } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: '班级不存在' });
    }

    // 验证权限
    if (classDoc.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有班级创建者可以移除学生' });
    }

    let removedCount = 0;
    let joinedRemovedCount = 0;

    // 软删除指定学生
    for (const studentToRemove of studentsToRemove) {
      const student = classDoc.studentList.find(s => 
        s.studentId === studentToRemove.studentId && !s.isRemoved
      );
      
      if (student) {
        student.isRemoved = true;
        student.removedAt = new Date();
        student.removedBy = teacherId;
        removedCount++;
        
        if (studentToRemove.hasJoined) {
          joinedRemovedCount++;
        }
      }
    }

    // 记录编辑历史
    classDoc.editHistory.push({
      action: 'remove_students',
      details: {
        removedCount,
        joinedRemovedCount,
        studentIds: studentsToRemove.map(s => s.studentId)
      },
      editedAt: new Date(),
      editedBy: teacherId
    });

    await classDoc.save();

    res.json({
      success: true,
      message: `已移除 ${removedCount} 名学生（其中 ${joinedRemovedCount} 名已加入班级）`,
      removedCount,
      joinedRemovedCount
    });

  } catch (err) {
    console.error('移除班级学生失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '移除失败：' + (err.message || '服务器错误') 
    });
  }
};

// 📌 新增：获取班级历史记录
const getClassHistory = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: '班级不存在' });
    }

    // 验证权限
    if (classDoc.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有班级创建者可以查看历史记录' });
    }

    // 获取已移除的学生
    const removedStudents = classDoc.studentList.filter(s => s.isRemoved);
    
    // 获取编辑历史
    const editHistory = classDoc.editHistory.sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));

    res.json({
      success: true,
      class: {
        name: classDoc.name,
        _id: classDoc._id
      },
      removedStudents,
      editHistory
    });

  } catch (err) {
    console.error('获取班级历史失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '获取历史失败：' + (err.message || '服务器错误') 
    });
  }
};

// 📌 新增：恢复学生
const restoreClassStudent = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { studentId } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: '班级不存在' });
    }

    // 验证权限
    if (classDoc.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有班级创建者可以恢复学生' });
    }

    const student = classDoc.studentList.find(s => 
      s.studentId === studentId && s.isRemoved
    );

    if (!student) {
      return res.status(404).json({ success: false, message: '未找到该学生或学生未被移除' });
    }

    // 恢复学生
    student.isRemoved = false;
    student.removedAt = null;
    student.removedBy = null;

    // 记录编辑历史
    classDoc.editHistory.push({
      action: 'restore_student',
      details: {
        studentName: student.name,
        studentId: student.studentId
      },
      editedAt: new Date(),
      editedBy: teacherId
    });

    await classDoc.save();

    res.json({
      success: true,
      message: `学生 ${student.name}(${student.studentId}) 已恢复`
    });

  } catch (err) {
    console.error('恢复学生失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '恢复失败：' + (err.message || '服务器错误') 
    });
  }
};

// 📌 新增：永久删除学生
const permanentDeleteStudent = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { studentId } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: '未授权访问' });
    }

    const classDoc = await ClassModel.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: '班级不存在' });
    }

    // 验证权限
    if (classDoc.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: '只有班级创建者可以删除学生' });
    }

    const studentIndex = classDoc.studentList.findIndex(s => 
      s.studentId === studentId && s.isRemoved
    );

    if (studentIndex === -1) {
      return res.status(404).json({ success: false, message: '未找到该学生或学生未被移除' });
    }

    const student = classDoc.studentList[studentIndex];

    // 永久删除学生
    classDoc.studentList.splice(studentIndex, 1);

    // 记录编辑历史
    classDoc.editHistory.push({
      action: 'permanent_delete_student',
      details: {
        studentName: student.name,
        studentId: student.studentId
      },
      editedAt: new Date(),
      editedBy: teacherId
    });

    await classDoc.save();

    res.json({
      success: true,
      message: `学生 ${student.name}(${student.studentId}) 已永久删除`
    });

  } catch (err) {
    console.error('永久删除学生失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '删除失败：' + (err.message || '服务器错误') 
    });
  }
};

// 📌 新增：定期清理30天前的软删除学生（硬删除）
const cleanupRemovedStudents = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const classes = await ClassModel.find({
      'studentList.isRemoved': true,
      'studentList.removedAt': { $lt: thirtyDaysAgo }
    });

    let cleanedCount = 0;

    for (const classDoc of classes) {
      const originalLength = classDoc.studentList.length;
      
      // 硬删除30天前被软删除的学生
      classDoc.studentList = classDoc.studentList.filter(student => {
        if (student.isRemoved && student.removedAt && student.removedAt < thirtyDaysAgo) {
          cleanedCount++;
          return false; // 删除此学生
        }
        return true; // 保留此学生
      });

      if (classDoc.studentList.length !== originalLength) {
        await classDoc.save();
      }
    }

    console.log(`清理完成：硬删除了 ${cleanedCount} 名30天前被软删除的学生`);
    return cleanedCount;

  } catch (err) {
    console.error('清理软删除学生失败:', err);
    throw err;
  }
};

module.exports = {
  createClass,
  getMyClasses,
  getClassById,
  joinClass,
  updateClassStudents,       // 📌 新增
  removeClassStudents,       // 📌 新增
  getClassHistory,           // 📌 新增
  restoreClassStudent,       // 📌 新增
  permanentDeleteStudent,    // 📌 新增
  cleanupRemovedStudents     // 📌 新增
};