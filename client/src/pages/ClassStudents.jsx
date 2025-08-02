// src/pages/ClassStudents.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button'; 

const ClassStudents = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  const fetchClass = async () => {
    try {
      const res = await api.get(`/class/${classId}`);
      if (res.data.success) {
        const cls = res.data.class;
        setStudents(cls.studentList || []);
        setClassName(cls.name);
      } else {
        setError(res.data.message || '获取班级失败');
      }
    } catch (err) {
      console.error('获取班级失败:', err);
      setError('网络错误或服务器异常');
    } finally {
      setLoading(false);
    }
  };

  fetchClass();
}, [classId]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <div className="max-w-4xl mx-auto">
      {/* 顶部标题 + 返回按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-blue-800 dark:text-blue-400">
          👥 班级学生 - {className}
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
        >
          👈 返回上一级
        </Button>
      </div>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">加载中...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl shadow-lg backdrop-blur-xl bg-white/60 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700/40">
            <table className="min-w-full rounded-2xl">
              <thead>
                <tr className="bg-white/50 dark:bg-gray-700/50 text-left text-sm text-gray-600 dark:text-gray-300">
                  <th className="py-3 px-4">姓名</th>
                  <th className="py-3 px-4">学号</th>
                  <th className="py-3 px-4">状态</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu, index) => {
                  const notJoined = !stu.userId;
                  return (
                    <tr
                      key={index}
                      className={`
                        border-t border-white/10 dark:border-gray-700/40 
                        text-sm text-gray-800 dark:text-gray-200 transition
                        ${notJoined 
                          ? "bg-red-50/60 dark:bg-red-900/20 hover:bg-red-100/60 dark:hover:bg-red-900/40" 
                          : "hover:bg-white/60 dark:hover:bg-gray-700/50"}
                      `}
                    >
                      <td className="py-2 px-4">{stu.name}</td>
                      <td className="py-2 px-4">{stu.studentId}</td>
                      <td className="py-2 px-4">
                        {stu.userId ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            ✅ 已加入
                            {stu.joinedAt && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                （{new Date(stu.joinedAt).toLocaleString()}）
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-red-500 dark:text-red-400 font-medium">❌ 未加入</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        )}
      </div>
    </div>

  );
};

export default ClassStudents;
