// server/workers/src/index.js - Workers 渐进式改造主入口

import { handleAuth } from './routes/auth.js';
import { handleUser } from './routes/user.js';
import { handleTask } from './routes/task.js';
import { handleClass } from './routes/class.js';
import { handleSubmission } from './routes/submission.js';
import { handleAIGC } from './routes/aigc.js';
import { handleDownload } from './routes/download.js';
import { handleFeedback } from './routes/feedback.js';
import { handleCORS, corsHeaders } from './utils/cors.js';

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      console.log(`[${new Date().toISOString()}] ${method} ${path}`);

      // 路由分发 - 逐步迁移现有路由
      
      // 认证相关 (/api/auth/*)
      if (path.startsWith('/api/auth/')) {
        return await handleAuth(request, env, path, method);
      }
      
      // 用户相关 (/api/user/*)  
      if (path.startsWith('/api/user/')) {
        return await handleUser(request, env, path, method);
      }
      
      // 任务相关 (/api/task/*)
      if (path.startsWith('/api/task')) {
        return await handleTask(request, env, path, method);
      }

      // 班级相关 (/api/class/*)
      if (path.startsWith('/api/class/')) {
        return await handleClass(request, env, path, method);
      }

      // 提交相关 (/api/submission/*)
      if (path.startsWith('/api/submission/')) {
        return await handleSubmission(request, env, path, method);
      }

      // AIGC相关 (/api/aigc/*)
      if (path.startsWith('/api/aigc/')) {
        return await handleAIGC(request, env, path, method);
      }

      // 文件下载 (/api/download/*)
      if (path.startsWith('/api/download/')) {
        return await handleDownload(request, env, path, method);
      }

      // 反馈相关 (/api/feedback/*)
      if (path.startsWith('/api/feedback')) {
        return await handleFeedback(request, env, path, method);
      }

      // 健康检查和根路径
      if (path === '/' || path === '/health' || path === '/api' || path === '/api/') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'PoTAcademy API v2 (Workers) - 渐进式迁移版本',
          timestamp: new Date().toISOString(),
          version: '2.0.0-workers',
          originalAPI: '基于 Express 改造',
          database: 'Cloudflare D1',
          storage: 'Cloudflare R2'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // API 路由列表（开发时便于调试）
      if (path === '/api/routes') {
        return new Response(JSON.stringify({
          routes: [
            'POST /api/auth/register - 用户注册',
            'POST /api/auth/login - 用户登录', 
            'GET /api/auth/me - 获取用户信息',
            'GET /api/user/profile - 用户资料',
            'POST /api/task - 发布任务（教师）',
            'GET /api/task/mine - 获取我的任务',
            'GET /api/task/all - 获取所有任务（学生）',
            'POST /api/class/create - 创建班级',
            'GET /api/class/my-classes - 我的班级',
            'POST /api/class/join - 加入班级',
            // ... 更多路由将逐步添加
          ],
          note: '这是从 Express 版本迁移到 Workers 的渐进式版本'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // 404 处理
      return new Response(JSON.stringify({
        error: 'Route Not Found',
        path: path,
        method: method,
        availableRoutes: '/api/routes',
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Workers Runtime Error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5), // 限制堆栈信息
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};