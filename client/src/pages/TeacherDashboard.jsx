import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

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
    try {
      await api.post('/task', form);
      setMessage('✅ 任务发布成功！');
      setForm({
        title: '',
        category: '课堂练习',
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
            👩‍🏫 欢迎回来，{user.email}
          </h1>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => navigate('/create-class')}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
            >
              ➕ 创建新班级
            </button>

            <button
              onClick={() => navigate('/my-classes')}
              className="px-3 py-1.5 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-all"
            >
              📚 管理我的班级
            </button>
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

            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="allowAIGC"
                  checked={form.allowAIGC}
                  onChange={handleChange}
                />
                允许使用 AIGC
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="requireAIGCLog"
                  checked={form.requireAIGCLog}
                  onChange={handleChange}
                />
                要求上传 AIGC 原始记录
              </label>
            </div>

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

            <button className="w-full bg-blue-600 hover:bg-blue-700 
                              text-white p-2 rounded-xl shadow 
                              font-medium transition-all duration-300">
              📤 发布任务
            </button>

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



                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    截止时间：{' '}
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString()
                      : '未设置'}
                  </p>
                  <button
                    onClick={() => navigate(`/task/${task._id}/submissions`)}
                    className="mt-2 px-3 py-1.5 text-sm rounded-md 
                                bg-blue-600 hover:bg-blue-700 
                                text-white shadow-sm transition-all"
                  >
                    查看提交记录
                  </button>
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
