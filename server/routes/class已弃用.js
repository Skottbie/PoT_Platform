console.log('Hello World!');
import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import ClassModel from '../models/Class.js';
import { requireLogin, requireRole } from '../middleware/auth.js';
import stripBom from 'strip-bom-stream';

console.log('ClassModel:', ClassModel); // 应该打印一个函数（模型）

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// ✅ 生成唯一邀请码
async function generateUniqueInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempts = 0;
  while (attempts < 10) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    console.log(`尝试生成邀请码(${attempts + 1}):`, code);
    try {
      const found = await ClassModel.findOne({ inviteCode: code });
      if (!found) {
        console.log('邀请码未重复，使用:', code);
        return code;
      } else {
        console.log('邀请码重复，继续尝试');
      }
    } catch (err) {
      console.error('数据库查询邀请码出错:', err);
      throw err;
    }
    attempts++;
  }
  console.error('❌ 所有邀请码都重复，未能生成');
  console.log('--- 尝试抛出邀请码生成失败的错误 ---');
  throw new Error('邀请码生成失败，尝试次数过多');
  console.log('--- 错误已抛出，不会执行到这里 ---');
}



// 教师创建班级
/*
router.post(
  '/create',
  requireLogin,
  requireRole('teacher'),
  upload.single('studentList'),

  async (req, res) => {
    try {
      const { name, description } = req.body;
      const filePath = req.file.path;

      // ✅ 解析 CSV 成 studentList[]
      const students = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(stripBom()) // 💥 去除 UTF-8 BOM
          .pipe(csvParser())
          .on('data', (row) => {
            if (row.name && row.studentId) {
              results.push({
                name: row.name.trim(),
                studentId: row.studentId.trim(),
              });
            }
          })
          .on('end', () => {
            fs.unlinkSync(filePath);
            resolve(results);
          })
          .on('error', (err) => reject(err));
      });

      // ✅ 生成不重复的邀请码
      const inviteCode = await generateUniqueInviteCode();
      console.log('👉 生成的邀请码:', inviteCode); // 加上这行



      const newClass = new ClassModel({
        name,
        description,
        teacherId: req.user.id,
        inviteCode, // ✅ 保存唯一邀请码
        studentList: students,
      });

      await newClass.save();

      res.json({
        success: true,
        message: '班级创建成功',
        classId: newClass._id,
        inviteCode, // ✅ 返回邀请码供前端显示
      });
    } catch (err) {
      console.error('创建班级失败:', err);
      res.status(500).json({ success: false, message: '班级创建失败' });
    }
  }
);
*/

router.post(
  '/create',
  requireLogin,
  requireRole('teacher'),
  upload.single('studentList'),

  async (req, res) => {
    try {
      // 尽可能早地打印这些值
      console.log('DEBUG: 开始处理班级创建请求');
      console.log('DEBUG: req.body.name:', req.body.name);
      console.log('DEBUG: req.body.description:', req.body.description);
      console.log('DEBUG: req.user:', req.user); // *** 将它放在这里 ***
      console.log('DEBUG: req.file:', req.file); // 检查 req.file 完整对象
      console.log('DEBUG: filePath (req.file?.path):', req.file?.path);

      const { name, description } = req.body;
      const filePath = req.file?.path;

      if (!filePath) {
        console.error('DEBUG: 上传文件缺失');
        return res.status(400).json({ success: false, message: '上传文件缺失' });
      }

      // ✅ 解析 CSV 文件成 studentList[]
      const students = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(stripBom())
          .pipe(csvParser())
          .on('data', (row) => {
            console.log('📄 CSV行:', row); // 这里的日志您已经看到了
            const nameKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'name');
            const studentIdKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'studentid');
            if (nameKey && studentIdKey) {
              results.push({
                name: row[nameKey].trim(),
                studentId: row[studentIdKey].trim(),
              });
            } else {
              console.warn('⚠️ 无效 CSV 行:', row);
            }
          })
          .on('end', () => {
            fs.unlinkSync(filePath);
            console.log('DEBUG: ✅ CSV 解析完成，学生列表:', results); // 新增日志
            resolve(results);
          })
          .on('error', (err) => {
              console.error('DEBUG: CSV 解析错误:', err); // 新增日志
              reject(err);
          });
      });

      // ✅ 生成邀请码
      console.log('DEBUG: 准备生成邀请码...'); // 新增日志
      const inviteCode = await generateUniqueInviteCode();
      console.log('DEBUG: ✅ 生成的邀请码 (从函数返回后):', inviteCode); // 再次确认
      console.log('DEBUG: ✅ inviteCode 传入 newClass 前的值:', inviteCode);

      // 检查 teacherId 的实际值
      const actualTeacherId = req.user?.id;
      console.log('DEBUG: 实际 teacherId:', actualTeacherId); // *** 新增日志 ***

      // ✅ 构建新班级对象
      const newClass = new ClassModel({
        name,
        description,
        teacherId: actualTeacherId, // 使用明确的变量
        inviteCode,
        studentList: students,
      });

      console.log('DEBUG: 🆕 准备保存的新班级:', newClass);

      // ✅ 保存
      await newClass.save();

      console.log('DEBUG: 🎉 班级保存成功');
      res.json({
        success: true,
        message: '班级创建成功',
        classId: newClass._id,
        inviteCode,
      });

    } catch (err) {
      console.error('DEBUG: ❌ 创建班级失败 (捕获到错误):', err); // 更改日志
      // 添加更详细的错误处理
      if (err.name === 'ValidationError') {
          console.error('DEBUG: Mongoose 验证错误详情:', err.errors);
          return res.status(400).json({ success: false, message: '数据验证失败', details: err.errors });
      } else if (err.message === '邀请码生成失败，尝试次数过多') {
          return res.status(500).json({ success: false, message: '班级创建失败：无法生成唯一邀请码' });
      }
      res.status(500).json({ success: false, message: '班级创建失败' });
    }
  }
);


export default router;
