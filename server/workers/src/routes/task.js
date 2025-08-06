// server/src/workers/routes/task.js - 任务路由占位符

import { jsonResponse, errorResponse } from '../utils/cors.js';

export async function handleTask(request, env, path, method) {
  // 暂时返回占位响应
  return jsonResponse({
    message: 'Task routes - Coming soon',
    path,
    method
  });
}