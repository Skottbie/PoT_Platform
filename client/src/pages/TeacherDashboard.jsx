//client/src/pages/TeacherDashboard.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: '课堂练习',
    allowAIGC: false,
    requireAIGCLog: false,
    deadline: '',
    classIds: [],
  });
  const [message, setMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState([]);



  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        const res = await api.get('/user/profile');
        if (res.data.role !== 'teacher') return navigate('/');
        setUser(res.data);

        const taskRes = await api.get('/task/mine');
        setTasks(taskRes.data);

        const classRes = await api.get('/class/my-classes');
        if (classRes.data.success) {
          setMyClasses(classRes.data.classes);
        }
      } catch {
        navigate('/');
      }
    };
    fetchUserAndTasks();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    // 如果要求AIGC记录但未允许AIGC，则阻止提交
    if (form.requireAIGCLog && !form.allowAIGC) {
      return setMessage('❌ 必须先允许使用AIGC，才能要求上传AIGC记录。');
    }

    try {
      await api.post('/task', form);
      setMessage('✅ 任务发布成功！');
      setForm({
        title: '',
        category: '课堂练习',
        needsFile: false, // 📌 恢复默认值
        allowAIGC: false,
        requireAIGCLog: false,
        deadline: '',
        classIds: [],
      });

      const taskRes = await api.get('/task/mine');
      setTasks(taskRes.data);
    } catch {
      setMessage('❌ 发布失败，请检查字段');
    }
  };

  if (!user)
    return <p className="text-center mt-10 text-gray-500">加载中...</p>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors duration-300">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            欢迎回来，{user.email}
          </h1>

          <div className="flex gap-3 mb-6">
            <Button variant="primary" size="sm" onClick={() => navigate('/create-class')}>
              ➕ 创建新班级
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/my-classes')}>
              📚 管理我的班级
            </Button>

          </div>


          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">发布新任务</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="title"
              placeholder="任务标题"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 
                             rounded-lg bg-white dark:bg-gray-700 
                             text-gray-900 dark:text-gray-100 
                             transition-colors duration-300 p-2"
            />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              任务提交要求
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              {/* 📌 新增：作业文件必交选项 */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="needsFile"
                  checked={form.needsFile}
                  onChange={handleChange}
                />
                要求提交作业文件
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="allowAIGC"
                  checked={form.allowAIGC}
                  onChange={handleChange}
                />
                允许使用 AIGC
              </label>

              {/* 📌 修改：当 allowAIGC 为 false 时禁用 */}
              <label className={`flex items-center gap-2 text-sm ${!form.allowAIGC ? 'text-gray-400' : ''}`}>
                <input
                  type="checkbox"
                  name="requireAIGCLog"
                  checked={form.requireAIGCLog}
                  onChange={handleChange}
                  disabled={!form.allowAIGC}
                />
                要求上传 AIGC 原始记录
              </label>
            </div>
            
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 
                             rounded-lg bg-white dark:bg-gray-700 
                             text-gray-900 dark:text-gray-100 
                             transition-colors duration-300 p-2"
            >
              <option value="课堂练习">课堂练习</option>
              <option value="课程任务">课程任务</option>
            </select>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">📌 选择关联班级</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {myClasses.map((cls) => (
                  <label key={cls._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      value={cls._id}
                      checked={form.classIds.includes(cls._id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const id = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          classIds: checked
                            ? [...prev.classIds, id]
                            : prev.classIds.filter((cid) => cid !== id),
                        }));
                      }}
                    />
                    {cls.name}
                  </label>
                ))}
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">📅设置截止时间</p>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 
                             rounded-lg bg-white dark:bg-gray-700 
                             text-gray-900 dark:text-gray-100 
                             transition-colors duration-300 p-2"
            />

            <Button variant="primary" size="md" fullWidth>
              📤 发布任务
            </Button>


            {message && (
              <p
                className={`text-center text-sm mt-2 ${
                  message.startsWith('✅') ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">📂 我发布的任务</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">暂无任务</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="border border-gray-200 dark:border-gray-700 
                               rounded-2xl p-4 bg-white dark:bg-gray-800 
                               shadow transition-colors duration-300"
                >
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    分类：{task.category}
                  </p>
                  {/* 📌 新增：显示 needsFile 状态 */}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    作业文件：{task.needsFile ? '必交' : '可选'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    截止时间：{' '}
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString()
                      : '未设置'}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate(`/task/${task._id}/submissions`)}
                  >
                    查看提交记录
                  </Button>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;


