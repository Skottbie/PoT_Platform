// server/workers/src/routes/auth.js - 认证模块 Workers 迁移版本

import { jsonResponse, errorResponse } from '../utils/cors.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { generateJWT, verifyJWT } from '../utils/jwt.js';

export async function handleAuth(request, env, path, method) {
  const route = path.replace('/api/auth', '');

  console.log(`[AUTH] ${method} ${route}`);

  try {
    switch (route) {
      case '/register':
        if (method === 'POST') return await handleRegister(request, env);
        break;
      
      case '/login':
        if (method === 'POST') return await handleLogin(request, env);
        break;
        
      case '/me':
        if (method === 'GET') return await handleMe(request, env);
        break;
    }

    return errorResponse(`Auth route not found: ${method} ${route}`, 404);
  } catch (error) {
    console.error('[AUTH] Error:', error);
    return errorResponse('Authentication service error: ' + error.message);
  }
}

// 📌 从原始 Express 版本迁移：注册功能
async function handleRegister(request, env) {
  try {
    const body = await request.json();
    const { email, password, role, inviteCode } = body;

    // 输入验证
    if (!email || !password || !role || !inviteCode) {
      return errorResponse('缺少必填字段：email, password, role, inviteCode', 400);
    }

    if (!['teacher', 'student'].includes(role)) {
      return errorResponse('角色必须是 teacher 或 student', 400);
    }

    // 📌 迁移原逻辑：验证邀请码
    const teacherCode = env.TEACHER_INVITE_CODE || 'TEACHER2024';
    const studentCode = env.STUDENT_INVITE_CODE || 'STUDENT2024';
    
    if (role === 'teacher' && inviteCode !== teacherCode) {
      return errorResponse('教师邀请码不正确', 400);
    }
    
    if (role === 'student' && inviteCode !== studentCode) {
      return errorResponse('学生邀请码不正确', 400);
    }

    // 📌 迁移原逻辑：检查重复用户（从 Mongoose 改为 D1 SQL）
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return errorResponse('用户已存在', 400);
    }

    // 📌 迁移原逻辑：创建用户
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    const result = await env.DB.prepare(`
      INSERT INTO users (id, email, password, role, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(userId, email, hashedPassword, role).run();

    if (!result.success) {
      throw new Error('数据库写入失败');
    }

    console.log(`[AUTH] 用户注册成功: ${email} (${role})`);

    return jsonResponse({
      success: true,
      message: '注册成功',
      userId: userId
    }, 201);

  } catch (error) {
    console.error('[AUTH] 注册失败:', error);
    return errorResponse('注册失败: ' + error.message, 500);
  }
}

// 📌 从原始 Express 版本迁移：登录功能
async function handleLogin(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('邮箱和密码不能为空', 400);
    }

    // 📌 迁移原逻辑：查找用户（从 Mongoose 改为 D1 SQL）
    const user = await env.DB.prepare(
      'SELECT id, email, password, role, created_at FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return errorResponse('用户不存在', 400);
    }

    // 📌 迁移原逻辑：验证密码（从 bcrypt 改为 Web Crypto）
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return errorResponse('密码错误', 400);
    }

    // 📌 迁移原逻辑：生成 JWT（保持相同的payload结构）
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = await generateJWT(tokenPayload, env.JWT_SECRET);

    console.log(`[AUTH] 用户登录成功: ${email} (${user.role})`);

    // 📌 保持与原 Express 版本相同的响应格式
    return jsonResponse({
      success: true,
      token,
      role: user.role,
      message: '登录成功'
    });

  } catch (error) {
    console.error('[AUTH] 登录失败:', error);
    return errorResponse('登录失败: ' + error.message, 500);
  }
}

// 📌 从原始 Express 版本迁移：获取用户信息
async function handleMe(request, env) {
  try {
    // 📌 迁移原逻辑：验证 JWT Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('未提供有效的 Token', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyJWT(token, env.JWT_SECRET);
    
    if (!payload) {
      return errorResponse('Token 无效或已过期', 401);
    }

    // 📌 迁移原逻辑：从数据库获取最新用户信息
    const user = await env.DB.prepare(
      'SELECT id, email, role, created_at FROM users WHERE id = ?'
    ).bind(payload.id).first();

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    // 📌 保持与原 Express 版本相同的响应格式
    return jsonResponse({
      success: true,
      message: '这是受保护的信息',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('[AUTH] 获取用户信息失败:', error);
    return errorResponse('获取用户信息失败: ' + error.message, 401);
  }
}