//client/src/pages/StudentDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        const res = await api.get('/user/profile');
        if (res.data.role !== 'student') return navigate('/');
        setUser(res.data);

        const taskRes = await api.get('/task/all');
        const taskList = taskRes.data;

        const results = await Promise.all(
          taskList.map(async (task) => {
            const r = await api.get(`/submission/check/${task._id}`);
            return { ...task, submitted: r.data.submitted };
          })
        );

        setTasks(results);
      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };

    fetchUserAndTasks();
  }, [navigate]);

  // 📌 新增：格式化截止时间
  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 📌 新增：获取任务状态
  const getTaskStatus = (task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    
    if (task.submitted) {
      return {
        status: 'submitted',
        text: '✅ 已提交',
        color: 'text-green-600 dark:text-green-400',
        canSubmit: false
      };
    }
    
    if (now > deadline) {
      if (task.allowLateSubmission) {
        return {
          status: 'late',
          text: '⚠️ 已逾期（可提交）',
          color: 'text-orange-600 dark:text-orange-400',
          canSubmit: true
        };
      } else {
        return {
          status: 'expired',
          text: '❌ 已截止',
          color: 'text-red-600 dark:text-red-400',
          canSubmit: false
        };
      }
    }
    
    // 计算剩余时间
    const timeDiff = deadline - now;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor(timeDiff / (1000 * 60));
    
    if (days > 1) {
      return {
        status: 'normal',
        text: `📅 还有${days}天`,
        color: 'text-blue-600 dark:text-blue-400',
        canSubmit: true
      };
    } else if (hours > 2) {
      return {
        status: 'warning',
        text: `⏰ 还有${hours}小时`,
        color: 'text-yellow-600 dark:text-yellow-400',
        canSubmit: true
      };
    } else {
      return {
        status: 'urgent',
        text: `🔥 还有${minutes}分钟`,
        color: 'text-red-600 dark:text-red-400',
        canSubmit: true
      };
    }
  };

  // 📌 新增：获取任务卡片样式
  const getTaskCardStyle = (taskStatus) => {
    const baseStyle = "p-6 rounded-2xl border shadow-md backdrop-blur-md hover:shadow-xl hover:scale-[1.01] transition-all duration-200";
    
    switch (taskStatus.status) {
      case 'submitted':
        return `${baseStyle} bg-green-50/70 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50`;
      case 'expired':
        return `${baseStyle} bg-red-50/70 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50`;
      case 'late':
        return `${baseStyle} bg-orange-50/70 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-700/50`;
      case 'urgent':
        return `${baseStyle} bg-red-50/70 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50`;
      case 'warning':
        return `${baseStyle} bg-yellow-50/70 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-700/50`;
      default:
        return `${baseStyle} bg-white/70 dark:bg-gray-800/60 border-gray-200/50 dark:border-gray-700/50`;
    }
  };

  if (!user) return <p className="text-center mt-10 text-gray-600 dark:text-gray-400">加载中...</p>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
          欢迎回来，
          <span className="text-blue-600 dark:text-blue-400">{user.email}</span>
        </h1>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate('/join-class')}
            className="px-4 py-2 rounded-xl
                      bg-gradient-to-r from-blue-500/80 to-purple-500/80
                      text-white shadow-md backdrop-blur-md
                      hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:scale-[1.02]
                      active:scale-95 transition-all duration-200"
          >
            ➕ 加入班级
          </button>
        </div>

        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
          📚 当前任务
        </h2>

        <div className="grid gap-6">
          {tasks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">暂无任务</p>
          ) : (
            tasks.map((task) => {
              const taskStatus = getTaskStatus(task);
              return (
                <div
                  key={task._id}
                  className={getTaskCardStyle(taskStatus)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {task.title}
                    </h3>
                    <span className={`text-sm font-medium ${taskStatus.color}`}>
                      {taskStatus.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📂 分类：{task.category}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📝 作业文件：{task.needsFile ? '必交' : '可选'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        🤖 AIGC 使用：{task.allowAIGC ? '允许' : '禁止'}
                      </p>
                      {task.allowAIGC && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          📋 AIGC 日志：{task.requireAIGCLog ? '必交' : '可选'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ⏰ 截止时间：{formatDeadline(task.deadline)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📚 所属班级：
                        {task.classIds && task.classIds.length > 0
                          ? task.classIds.map(cls => cls.name).join('，')
                          : '未绑定'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        📋 逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}
                      </p>
                      {/* 📌 新增：逾期提交提示 */}
                      {taskStatus.status === 'late' && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                          ⚠️ 此任务已逾期，提交后将被标注为逾期作业
                        </p>
                      )}
                    </div>
                  </div>

                  {taskStatus.canSubmit && (
                    <button
                      onClick={() => navigate(`/submit/${task._id}`)}
                      className={`mt-4 px-5 py-2 rounded-xl text-white shadow-md backdrop-blur-md
                                  hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 ${
                        taskStatus.status === 'late' 
                          ? 'bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-500 hover:to-red-500'
                          : taskStatus.status === 'urgent'
                          ? 'bg-gradient-to-r from-red-500/80 to-pink-500/80 hover:from-red-500 hover:to-pink-500'
                          : 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 hover:from-blue-500 hover:to-purple-500'
                      }`}
                    >
                      {taskStatus.status === 'late' ? '⚠️ 逾期提交' : '📤 提交作业'}
                    </button>
                  )}

                  {!taskStatus.canSubmit && taskStatus.status === 'expired' && (
                    <div className="mt-4 px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center">
                      ❌ 已截止，无法提交
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;