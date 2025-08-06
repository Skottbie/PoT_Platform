// server/workers/src/routes/user.js - 用户路由占位符

import { jsonResponse, errorResponse } from '../utils/cors.js';

export async function handleUser(request, env, path, method) {
  // 暂时返回占位响应
  return jsonResponse({
    message: 'User routes - Coming soon',
    path,
    method
  });
}