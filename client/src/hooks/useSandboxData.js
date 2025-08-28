// client/src/hooks/useSandboxData.js
// 🎭 沙盒模式数据拦截Hook

import { useCallback } from 'react';
import { useSandbox } from '../contexts/SandboxContext';

export const useSandboxData = () => {
  const { 
    isSandboxMode, 
    getSandboxData, 
    recordSandboxChange,
    DEMO_DATA 
  } = useSandbox();

  // 🎯 拦截API调用并返回沙盒数据
  const interceptApiCall = useCallback(async (url, originalApiCall) => {
    if (!isSandboxMode) {
      // 非沙盒模式，正常调用API
      return await originalApiCall();
    }

    // 🎭 沙盒模式下返回示例数据
    console.log(`🎭 沙盒拦截: ${url}`);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    // 根据URL返回对应的示例数据
    if (url.includes('/user/profile')) {
      return {
        data: {
          _id: 'demo-teacher-1',
          email: 'demo.teacher@potacademy.net',
          role: 'teacher',
          nickname: '演示教师',
          preferences: {
            showNicknamePrompt: false,
            theme: 'auto'
          },
          createdAt: new Date('2024-09-15'),
        }
      };
    }

    if (url.includes('/class/my-classes')) {
      return {
        data: {
          success: true,
          classes: getSandboxData('classes') || []
        }
      };
    }

    if (url.includes('/task/mine')) {
      const category = url.includes('category=archived') ? 'archived' :
                     url.includes('category=deleted') ? 'deleted' : 'active';
      
      const allTasks = getSandboxData('tasks') || [];
      let filteredTasks = [];

      if (category === 'active') {
        filteredTasks = allTasks.filter(task => !task.isArchived && !task.isDeleted);
      } else if (category === 'archived') {
        filteredTasks = allTasks.filter(task => task.isArchived && !task.isDeleted);
      } else if (category === 'deleted') {
        filteredTasks = allTasks.filter(task => task.isDeleted);
      }

      return { data: filteredTasks };
    }

    if (url.includes('/task/all')) {
      // 学生端获取任务
      const category = url.includes('category=archived') ? 'archived' : 'active';
      const allTasks = getSandboxData('tasks') || [];
      
      let filteredTasks = [];
      if (category === 'active') {
        filteredTasks = allTasks.filter(task => !task.isArchived);
      } else {
        filteredTasks = allTasks.filter(task => task.isArchived);
      }

      return { data: filteredTasks };
    }

    if (url.includes('/submission/by-task/')) {
      // 获取任务提交记录
      const taskId = url.split('/').pop();
      const submissions = getSandboxData('submissions')?.filter(sub => sub.task === taskId) || [];
      
      return { data: submissions };
    }

    if (url.includes('/download/')) {
      // 下载AIGC日志
      const logId = url.split('/').pop();
      const aigcLogs = DEMO_DATA?.aigcLogs || {};
      const logContent = aigcLogs[logId] || [];
      
      return { data: logContent };
    }

    // 默认返回空数据
    console.warn(`🎭 沙盒模式: 未处理的API调用 ${url}`);
    return { data: [] };
    
  }, [isSandboxMode, getSandboxData, DEMO_DATA]);

  // 🎯 拦截POST/PUT/DELETE操作（记录但不执行）
  const interceptApiMutation = useCallback(async (method, url, data, originalApiCall) => {
    if (!isSandboxMode) {
      // 非沙盒模式，正常调用API
      return await originalApiCall();
    }

    // 🎭 沙盒模式下记录操作但不执行
    console.log(`🎭 沙盒记录操作: ${method} ${url}`, data);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

    // 记录操作
    recordSandboxChange(method, url, data);

    // 根据操作类型返回模拟响应
    if (url.includes('/task') && method === 'POST') {
      // 创建任务
      return {
        data: {
          success: true,
          message: '沙盒模式：任务创建成功（未实际保存）',
          task: {
            _id: `demo-new-task-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            createdBy: 'demo-teacher-1'
          }
        }
      };
    }

    if (url.includes('/class') && method === 'POST') {
      // 创建班级
      return {
        data: {
          success: true,
          message: '沙盒模式：班级创建成功（未实际保存）',
          class: {
            _id: `demo-new-class-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            teacherId: 'demo-teacher-1'
          }
        }
      };
    }

    // 通用成功响应
    return {
      data: {
        success: true,
        message: `沙盒模式：${method} 操作已记录（未实际执行）`
      }
    };

  }, [isSandboxMode, recordSandboxChange]);

  // 🎯 便捷的API封装函数
  const sandboxApiGet = useCallback((url, originalApiCall) => {
    return interceptApiCall(url, originalApiCall);
  }, [interceptApiCall]);

  const sandboxApiPost = useCallback((url, data, originalApiCall) => {
    return interceptApiMutation('POST', url, data, originalApiCall);
  }, [interceptApiMutation]);

  const sandboxApiPut = useCallback((url, data, originalApiCall) => {
    return interceptApiMutation('PUT', url, data, originalApiCall);
  }, [interceptApiMutation]);

  const sandboxApiDelete = useCallback((url, originalApiCall) => {
    return interceptApiMutation('DELETE', url, null, originalApiCall);
  }, [interceptApiMutation]);

  return {
    isSandboxMode,
    sandboxApiGet,
    sandboxApiPost,
    sandboxApiPut,
    sandboxApiDelete,
    interceptApiCall,
    interceptApiMutation
  };
};