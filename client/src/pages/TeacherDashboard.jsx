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
    needsFile: false,
    allowAIGC: false,
    requireAIGCLog: false,
    deadline: '',
    deadlineTime: '', // 📌 新增：时间字段
    allowLateSubmission: false, // 📌 新增：是否允许逾期提交
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

    // 📌 新增：验证截止日期和时间
    if (!form.deadline) {
      return setMessage('❌ 请设置截止日期。');
    }
    if (!form.deadlineTime) {
      return setMessage('❌ 请设置截止时间。');
    }

    // 📌 合并日期和时间
    const deadlineDateTime = new Date(`${form.deadline}T${form.deadlineTime}`);
    const now = new Date();
    
    if (deadlineDateTime <= now) {
      return setMessage('❌ 截止时间必须晚于当前时间。');
    }

    try {
      const submitData = {
        ...form,
        deadline: deadlineDateTime.toISOString(), // 提交完整的日期时间
      };
      delete submitData.deadlineTime; // 删除临时字段

      await api.post('/task', submitData);
      setMessage('✅ 任务发布成功！');
      setForm({
        title: '',
        category: '课堂练习',
        needsFile: false,
        allowAIGC: false,
        requireAIGCLog: false,
        deadline: '',
        deadlineTime: '',
        allowLateSubmission: false,
        classIds: [],
      });

      const taskRes = await api.get('/task/mine');
      setTasks(taskRes.data);
    } catch (err) {
      console.error(err);
      setMessage('❌ 发布失败，请检查字段');
    }
  };

  // 📌 新增：格式化显示截止时间
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

  // 📌 新增：判断任务状态
  const getTaskStatus = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    if (now > deadlineDate) {
      return { status: 'expired', text: '已截止', color: 'text-red-600 dark:text-red-400' };
    } else {
      const timeDiff = deadlineDate - now;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 1) {
        return { status: 'normal', text: `还有${days}天`, color: 'text-green-600 dark:text-green-400' };
      } else if (hours > 1) {
        return { status: 'warning', text: `还有${hours}小时`, color: 'text-yellow-600 dark:text-yellow-400' };
      } else {
        const minutes = Math.floor(timeDiff / (1000 * 60));
        return { status: 'urgent', text: `还有${minutes}分钟`, color: 'text-red-600 dark:text-red-400' };
      }
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

            {/* 📌 新增：截止时间设置 */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">⏰ 设置截止时间</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">截止日期</label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 
                                   rounded-lg bg-white dark:bg-gray-700 
                                   text-gray-900 dark:text-gray-100 
                                   transition-colors duration-300 p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">截止时间</label>
                  <input
                    type="time"
                    name="deadlineTime"
                    value={form.deadlineTime}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 
                                   rounded-lg bg-white dark:bg-gray-700 
                                   text-gray-900 dark:text-gray-100 
                                   transition-colors duration-300 p-2"
                  />
                </div>
              </div>

              {/* 📌 新增：逾期提交设置 */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="allowLateSubmission"
                  checked={form.allowLateSubmission}
                  onChange={handleChange}
                />
                允许逾期提交（逾期提交将被特殊标注）
              </label>
            </div>

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
              {tasks.map((task) => {
                const taskStatus = getTaskStatus(task.deadline);
                return (
                  <div
                    key={task._id}
                    className="border border-gray-200 dark:border-gray-700 
                                 rounded-2xl p-4 bg-white dark:bg-gray-800 
                                 shadow transition-colors duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                        {task.title}
                      </p>
                      <span className={`text-sm font-medium ${taskStatus.color}`}>
                        {taskStatus.text}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>分类：{task.category}</p>
                      <p>作业文件：{task.needsFile ? '必交' : '可选'}</p>
                      <p>截止时间：{formatDeadline(task.deadline)}</p>
                      <p>逾期提交：{task.allowLateSubmission ? '允许' : '不允许'}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/task/${task._id}/submissions`)}
                      >
                        查看提交记录
                      </Button>
                      {/* 📌 新增：班级提交情况按钮 */}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/task/${task._id}/class-status`)}
                      >
                        班级提交情况
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;