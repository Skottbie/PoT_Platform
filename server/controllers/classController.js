// server/controllers/classController.js

const csvParser = require('csv-parser');
const { Readable } = require('stream');
//const ClassModel = require('../models/Class'); // <-- 修正：导入模型文件名是 Class.js
// const UserModel = require('../models/UserModel'); // 如果需要，请取消注释并使用
const ClassModel = require('../models/Class'); // <-- 关键修改


// ✅ 生成唯一邀请码 (从你之前的 class.js 中复制过来，并确保能访问 ClassModel)
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
            throw err; // 抛出错误以便外层捕获
        }
        attempts++;
    }
    console.error('DEBUG: ❌ 所有邀请码都重复，未能生成');
    throw new Error('邀请码生成失败，尝试次数过多');
}


const createClass = async (req, res) => {
    console.log('DEBUG: 进入 createClass 控制器'); // 新增日志
    try {
        // 关键调试信息，确保 req.user 和 req.file 存在
        console.log('DEBUG: req.body:', req.body);
        console.log('DEBUG: req.user:', req.user); 
        console.log('DEBUG: req.file:', req.file);

        const { name, description } = req.body;
        // 确保 req.user.id 存在，否则会是 undefined
        const teacherId = req.user?.id; // 使用可选链操作符更安全

        // 检查 teacherId 是否有效
        if (!teacherId) {
            console.error('DEBUG: 认证信息缺失或无效，teacherId 为空');
            return res.status(401).json({ success: false, message: '认证失败，教师ID缺失。请确保已登录并具有教师权限。' });
        }


        if (!req.file) {
            console.error('DEBUG: 未上传学生名单文件');
            return res.status(400).json({ success: false, message: '未上传学生名单文件' });
        }

        const students = [];

        // 使用 Promise 包装流式处理，以便 await
        await new Promise((resolve, reject) => {
            const stream = Readable.from(req.file.buffer.toString());
            stream
                .pipe(csvParser())
                .on('data', (row) => {
                    console.log('DEBUG: 📄 CSV原始行:', row); // 调试原始行

                    // 统一字段清洗逻辑，处理 BOM 字符
                    const cleanRow = {};
                    Object.keys(row).forEach((key) => {
                        const cleanKey = key.replace(/^\uFEFF/, ''); // 移除 UTF-8 BOM
                        cleanRow[cleanKey] = row[key];
                    });
                    
                    // 确保字段名是 'name' 和 'studentId' (小写且无 BOM)
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
                    resolve(); // 解析完成，解决 Promise
                })
                .on('error', (err) => {
                    console.error('DEBUG: ❌ CSV 解析失败：', err);
                    reject(err); // 解析失败，拒绝 Promise
                });
        });

        // ✅ 生成唯一邀请码 (在这里调用)
        console.log('DEBUG: 准备生成邀请码...');
        const inviteCode = await generateUniqueInviteCode();
        console.log('DEBUG: ✅ 生成的邀请码:', inviteCode);


        // 构建新班级对象
        const newClass = new ClassModel({
            name,
            description,
            teacherId: teacherId, // Class Schema 中是 teacherId
            inviteCode: inviteCode, // <-- 关键：传入生成的邀请码
            studentList: students, // Class Schema 中是 studentList
            // createdAt 会自动生成
        });

        console.log('DEBUG: 🆕 准备保存的新班级:', newClass);

        // 保存班级
        await newClass.save();

        console.log('DEBUG: 🎉 班级保存成功');
        res.status(201).json({
            success: true,
            message: '班级创建成功',
            classId: newClass._id,
            inviteCode: inviteCode, // 返回邀请码给前端
        });

    } catch (err) {
        console.error('DEBUG: ❌ 创建班级失败 (捕获到错误):', err);
        if (err.name === 'ValidationError') {
            // Mongoose 验证错误
            console.error('DEBUG: Mongoose 验证错误详情:', err.errors);
            // 提取所有验证错误信息
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: '数据验证失败', details: errors });
        } else if (err.message.includes('邀请码生成失败')) {
            // 自定义的邀请码生成失败错误
            return res.status(500).json({ success: false, message: '班级创建失败：无法生成唯一邀请码' });
        }
        // 其他未知错误
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};


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

/*
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const classDoc = await ClassModel.findById(id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: '班级不存在' });
    }

    res.json({ success: true, classData: classDoc });
  } catch (err) {
    console.error('获取班级失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
*/

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
      (s) => s.studentId === studentId && s.name === name
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


module.exports = {
  createClass,
  getMyClasses, // 添加到导出列表
  getClassById,
  joinClass,
};


