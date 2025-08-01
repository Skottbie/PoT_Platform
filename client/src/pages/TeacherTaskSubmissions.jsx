// src/pages/TeacherTaskSubmissions.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { API_BASE_URL } from '../config';

const TeacherTaskSubmissions = () => {
  const { taskId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJsons, setExpandedJsons] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get(`/submit/by-task/${taskId}`);
        setSubmissions(res.data);
      } catch (err) {
        console.error('获取提交失败', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [taskId, navigate]);

  const decodeFilename = (url) => {
    try {
      const raw = url.split(/[\\/]/).pop();
      const filename = raw.substring(raw.indexOf('-') + 1);
      return decodeURIComponent(filename);
    } catch {
      return '未知文件';
    }
  };

  const renderFileLinks = (url) => {
    const filename = url.split('/').pop();
    const decoded = decodeURIComponent(filename);
    const isPreviewable = /\.(pdf|jpg|jpeg|png|gif)$/i.test(decoded);

    return (
      <div className="space-y-2 text-sm mt-1">
        <div className="flex flex-wrap gap-2">
          {isPreviewable && (
            <a
              href={`${API_BASE_URL}/${url}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 
                        dark:bg-blue-700 dark:hover:bg-blue-800 text-xs shadow"
            >
              🔍 预览文件
            </a>
          )}
          <a
            href={`${API_BASE_URL}/${url}`}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 
                      dark:bg-blue-700 dark:hover:bg-blue-800 text-xs shadow"
          >
            ⬇️ 下载作业文件
          </a>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          文件名：{decodeFilename(url)}
        </p>
      </div>
    );
  };


  const renderAIGCLog = (url) => {
    const isExpanded = expandedJsons[url];

    const toggleJson = async () => {
      if (isExpanded) {
        setExpandedJsons((prev) => ({ ...prev, [url]: null }));
      } else {
        try {
          const res = await fetch(`${API_BASE_URL}/${url}`);
          const json = await res.json();
          setExpandedJsons((prev) => ({ ...prev, [url]: json }));
        } catch {
          setExpandedJsons((prev) => ({
            ...prev,
            [url]: [{ role: 'system', content: '❌ 加载失败' }],
          }));
        }
      }
    };

    return (
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-2">
          <a
            href={`${API_BASE_URL}/${url}`}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 
                      dark:bg-blue-700 dark:hover:bg-blue-800 text-xs shadow"
          >
            ⬇️ 下载 AIGC记录
          </a>
          <button
            onClick={toggleJson}
            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 
                      dark:bg-gray-700 dark:hover:bg-gray-600 
                      text-gray-800 dark:text-gray-200 text-xs shadow"
          >
            {isExpanded ? '🔽 收起内容' : '📖 展开查看内容'}
          </button>
        </div>

        {Array.isArray(isExpanded) && (
          <div className="mt-3 border rounded-xl p-4 bg-gray-50 dark:bg-gray-900 
                          max-h-96 overflow-y-auto space-y-3">
            {isExpanded.map((entry, idx) => (
              <div
                key={idx}
                className={`max-w-[75%] px-4 py-2 rounded-xl shadow-sm text-sm whitespace-pre-wrap 
                          ${entry.role === 'user'
                              ? 'bg-blue-100 dark:bg-blue-900/40 self-start text-left ml-2'
                              : 'bg-green-100 dark:bg-green-900/40 self-end text-right mr-2'}`}
              >
                <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {entry.role === 'user' ? '🧑 学生提问' : '🤖 AI 回复'}
                </div>
                {entry.content}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };


  if (loading) {
    return <p className="text-center mt-10 text-gray-500">加载中...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto relative">
        <button
          onClick={() => navigate('/teacher')}
          className="absolute top-0 right-0 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200
                    py-2 px-4 rounded-xl shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          ← 返回教师首页
        </button>

        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          📄 提交记录
        </h1>

        {submissions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">暂无学生提交。</p>
        ) : (
          <ul className="space-y-6">
            {submissions.map((s) => {
              const isMissingFile = !s.fileUrl;
              return (
                <li
                  key={s._id}
                  className={`p-5 rounded-2xl shadow-md space-y-3 border 
                              transition 
                              ${isMissingFile 
                                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30" 
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg"}`}
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <strong>👤 学生:</strong> {s.student?.email || '未知'}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <strong>📅 提交时间:</strong>{' '}
                    {new Date(s.submittedAt).toLocaleString()}
                  </p>

                  {s.fileUrl ? (
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📎 作业文件:</p>
                      {renderFileLinks(s.fileUrl)}
                    </div>
                  ) : (
                    <p className="text-red-600 dark:text-red-400 font-medium">❌ 学生未提交作业文件</p>
                  )}

                  {s.aigcLogUrl && (
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-1">
                        🤖 AIGC 原始记录:
                      </p>
                      {renderAIGCLog(s.aigcLogUrl)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>

  );
};

export default TeacherTaskSubmissions;
