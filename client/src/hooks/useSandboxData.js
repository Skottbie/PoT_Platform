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
      const classes = getSandboxData('classes') || [];
      
      // 🎯 构建学生姓名映射（模拟后端的populate过程）
      const studentNameMap = {};
      classes.forEach(classData => {
        classData.studentList.forEach(student => {
          if (student.userId) {
            studentNameMap[student.userId] = {
              name: student.name,
              email: `${student.name.toLowerCase().replace(/\s+/g, '')}@student.demo`
            };
          }
        });
      });
      
      // 🎯 为每个提交记录填充学生信息（模拟后端populate）
      const enrichedSubmissions = submissions.map(submission => ({
        ...submission,
        student: studentNameMap[submission.student] ? {
          _id: submission.student,
          email: studentNameMap[submission.student].email,
          name: studentNameMap[submission.student].name
        } : {
          _id: submission.student,
          email: 'unknown@demo.com',
          name: null
        }
      }));
      
      return { data: enrichedSubmissions };
    }

    if (url.includes('/download/')) {
    // 🎯 处理AIGC日志下载
    const logId = url.split('/').pop();
    
    // 🎯 正确获取沙盒AIGC日志数据
    const allAigcLogs = getSandboxData('aigcLogs') || {};
    const logContent = allAigcLogs[logId];
    
    // 🎯 如果找到对应的日志数据，返回
    if (logContent && Array.isArray(logContent)) {
        return { data: logContent };
    }
    
    // 🎯 如果没找到，但是logId格式正确，返回通用示例数据
    if (logId && logId.startsWith('demo-aigc-log-')) {
        return {
        data: [
            {
            role: 'user',
            content: '请帮我分析这个学习问题...',
            model: 'pot-tutor',
            timestamp: Date.now() - 300000,
            potMode: true
            },
            {
            role: 'assistant',
            content: '很好的问题！让我们先从你的理解开始，你觉得这个问题的关键点可能在哪里呢？',
            model: 'pot-tutor',
            timestamp: Date.now() - 280000,
            potMode: true
            },
            {
            role: 'user',
            content: '我觉得可能是概念理解不够深入',
            model: 'pot-tutor',
            timestamp: Date.now() - 200000,
            potMode: true
            },
            {
            role: 'assistant',
            content: '很好的洞察！那具体是哪个概念让你感到困惑？我们可以一步步来分析。',
            model: 'pot-tutor',
            timestamp: Date.now() - 180000,
            potMode: true
            }
        ]
        };
    }
    
    // 🎯 其他情况返回空数组
    return { data: [] };
    }

    // 🎯 新增：处理单个任务详情 /task/{id}
    if (url.match(/\/task\/[^\/]+$/) && !url.includes('/mine') && !url.includes('/all')) {
      const taskId = url.split('/').pop();
      const task = getSandboxData('tasks')?.find(t => t._id === taskId);
      
      if (task) {
        return { data: task };
      } else {
        // 如果找不到对应的示例任务，返回404模拟
        throw new Error('任务不存在');
      }
    }

    // 🎯 新增：处理班级提交情况 /task/{id}/class-status  
    if (url.includes('/class-status')) {
      const taskId = url.split('/')[2]; // 从 /task/{id}/class-status 中提取 id
      const task = getSandboxData('tasks')?.find(t => t._id === taskId);
      const classes = getSandboxData('classes') || [];
      const submissions = getSandboxData('submissions') || [];
      
      if (!task) {
        throw new Error('任务不存在');
      }

      // 构建班级提交状态数据
      const classStatusList = classes.map(classData => {
        const taskSubmissions = submissions.filter(sub => sub.task === taskId);
        
        // 构建提交映射
        const submissionMap = {};
        taskSubmissions.forEach(sub => {
          submissionMap[sub.student] = {
            submitted: true,
            submittedAt: sub.submittedAt,
            isLateSubmission: sub.isLateSubmission,
            lateMinutes: sub.lateMinutes || 0
          };
        });

        const students = classData.studentList.map(student => {
          const submissionInfo = submissionMap[student.userId] || {};
          
          return {
            name: student.name,
            studentId: student.studentId,
            userId: student.userId,
            hasJoined: !!student.userId,
            submitted: !!submissionInfo.submitted,
            submittedAt: submissionInfo.submittedAt,
            isLateSubmission: submissionInfo.isLateSubmission || false,
            lateMinutes: submissionInfo.lateMinutes || 0
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

      return {
        data: {
          success: true,
          task: {
            title: task.title,
            deadline: task.deadline,
            description: task.description,
            allowLateSubmission: task.allowLateSubmission
          },
          classStatus: classStatusList
        }
      };
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