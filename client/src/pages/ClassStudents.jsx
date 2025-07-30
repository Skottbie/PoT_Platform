// src/pages/ClassStudents.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

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
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-blue-800">👥 班级学生 - {className}</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-500 hover:underline"
          >
            ← 返回上一级
          </button>
        </div>

        {loading ? (
          <p>加载中...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow">
              <thead>
                <tr className="bg-gray-100 text-left text-sm text-gray-600">
                  <th className="py-2 px-4">姓名</th>
                  <th className="py-2 px-4">学号</th>
                  <th className="py-2 px-4">状态</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu, index) => (
                  <tr
                    key={index}
                    className="border-t text-sm text-gray-800 hover:bg-gray-50"
                  >
                    <td className="py-2 px-4">{stu.name}</td>
                    <td className="py-2 px-4">{stu.studentId}</td>
                    <td className="py-2 px-4">
                      {stu.userId ? (
                        <span className="text-green-600 font-semibold">
                          ✅ 已加入
                          {stu.joinedAt && (
                            <span className="ml-2 text-xs text-gray-500">
                              （{new Date(stu.joinedAt).toLocaleString()}）
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">❌ 未加入</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassStudents;
