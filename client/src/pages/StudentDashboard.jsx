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

  if (!user) return <p className="text-center mt-10 text-gray-600 dark:text-gray-400">加载中...</p>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
          欢迎回来，
          <span className="text-blue-600 dark:text-blue-400">{user.email}</span>
        </h1>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate('/join-class')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow transition-all
                       dark:bg-blue-700 dark:hover:bg-blue-800"
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
            tasks.map((task) => (
              <div
                key={task._id}
                className="p-6 rounded-2xl bg-white shadow hover:shadow-md transition-all
                           dark:bg-gray-800 dark:hover:shadow-lg"
              >
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  分类：{task.category}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  截止时间：
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString()
                    : '未设置'}
                </p>

                <div className="text-sm text-gray-600 dark:text-gray-300 mt-3 space-y-1">
                  <p>{task.allowAIGC ? '✅ 允许使用 AIGC' : '❌ 不允许使用 AIGC'}</p>
                  <p>{task.requireAIGCLog ? '✅ 需上传原始记录' : '❌ 无需上传原始记录'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    所属班级：
                    {task.classIds && task.classIds.length > 0
                      ? task.classIds.map(cls => cls.name).join('，')
                      : '未绑定'}
                  </p>

                  <p className={`font-semibold ${task.submitted ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    提交状态：{task.submitted ? '✅ 已提交' : '❌ 未提交'}
                  </p>
                </div>

                {!task.submitted && (
                  <button
                    onClick={() => navigate(`/submit/${task._id}`)}
                    className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow
                               dark:bg-blue-700 dark:hover:bg-blue-800 transition-all"
                  >
                    提交作业
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
