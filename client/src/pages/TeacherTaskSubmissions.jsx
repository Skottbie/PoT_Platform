import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

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
      <div className="space-y-1 text-sm">
        {isPreviewable && (
          <a
            href={`http://localhost:5000/${url}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline mr-4"
          >
            🔍 预览文件
          </a>
        )}
        <a
          href={`http://localhost:5000/${filename}`}
          className="text-blue-600 underline"
        >
          ⬇️ 下载作业文件
        </a>
        <p className="text-xs text-gray-500 mt-1">
          文件名：{decodeFilename(url)}
        </p>
      </div>
    );
  };

  const renderAIGCLog = (url) => {
    const filename = decodeURIComponent(url.split('/').pop());
    const isExpanded = expandedJsons[url];

    const toggleJson = async () => {
      if (isExpanded) {
        setExpandedJsons((prev) => ({ ...prev, [url]: null }));
      } else {
        try {
          const res = await fetch(`http://localhost:5000/${url}`);
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
        <div className="space-x-4 text-sm">
          <a
            href={`http://localhost:5000/${filename}`}
            className="text-blue-600 underline"
          >
            ⬇️ 下载 AIGC记录
          </a>
          <button onClick={toggleJson} className="text-blue-600 underline">
            {isExpanded ? '🔽 收起内容' : '📖 展开查看内容'}
          </button>
        </div>

        {Array.isArray(isExpanded) && (
          <div className="mt-3 border rounded-xl p-4 bg-gray-50 max-h-96 overflow-y-auto space-y-3">
            {isExpanded.map((entry, idx) => (
              <div
                key={idx}
                className={`max-w-[75%] px-4 py-2 rounded-xl shadow-sm text-sm whitespace-pre-wrap ${
                  entry.role === 'user'
                    ? 'bg-blue-100 self-start text-left ml-2'
                    : 'bg-green-100 self-end text-right mr-2'
                }`}
              >
                <div className="text-xs font-medium text-gray-600 mb-1">
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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">📄 提交记录</h1>
      <button
        onClick={() => navigate('/teacher')}
        className="text-blue-600 underline text-sm mb-6 inline-block"
      >
        ← 返回教师首页
      </button>

      {submissions.length === 0 ? (
        <p className="text-gray-600">暂无学生提交。</p>
      ) : (
        <ul className="space-y-6">
          {submissions.map((s) => (
            <li
              key={s._id}
              className="border p-5 rounded-2xl bg-white shadow-md space-y-3"
            >
              <p className="text-sm text-gray-800">
                <strong>👤 学生:</strong> {s.student?.email || '未知'}
              </p>
              <p className="text-sm text-gray-800">
                <strong>📅 提交时间:</strong>{' '}
                {new Date(s.submittedAt).toLocaleString()}
              </p>

              <div>
                <p className="font-semibold text-gray-700 mb-1">📎 作业文件:</p>
                {renderFileLinks(s.fileUrl)}
              </div>

              {s.aigcLogUrl && (
                <div>
                  <p className="font-semibold text-gray-700 mt-4 mb-1">
                    🤖 AIGC 原始记录:
                  </p>
                  {renderAIGCLog(s.aigcLogUrl)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TeacherTaskSubmissions;
