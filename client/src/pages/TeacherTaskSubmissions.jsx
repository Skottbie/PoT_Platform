// src/pages/TeacherTaskSubmissions.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { API_BASE_URL } from '../config';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';

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
        // 后端返回的数据格式为 { _id, student, submittedAt, fileId, fileName, aigcLogId }
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

  // 📌 修改：renderFileLinks 函数
  // 现在函数接受文件ID和文件名作为参数
  const renderFileLinks = (fileId, fileName) => {
    // 根据后端路由修改 API_BASE_URL
    const url = `${API_BASE_URL}/download/${fileId}`;
    // 使用文件名来判断是否可预览，这才是正确的做法
    const isPreviewable = /\.(pdf|jpg|jpeg|png|gif)$/i.test(fileName);

    return (
      <div className="space-y-2 text-sm mt-1">
        <div className="flex flex-wrap gap-2">
          {isPreviewable && (
            <Button
              as="a"
              href={url}
              target="_blank"
              rel="noreferrer"
              size="sm"
              variant="primary"
            >
              🔍 预览文件
            </Button>
          )}
          <Button
            as="a"
            href={url}
            size="sm"
            variant="primary"
            // 建议：使用 download 属性，浏览器会以指定的文件名保存
            download={fileName}
          >
            ⬇️ 下载作业文件 ({fileName})
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          文件ID：{fileId}
        </p>
      </div>
    );
  };


  // 📌 修改：renderAIGCLog 函数
  const renderAIGCLog = (aigcLogId) => {
    const url = `${API_BASE_URL}/download/${aigcLogId}`;
    const isExpanded = expandedJsons[aigcLogId];

    const toggleJson = async () => {
      if (isExpanded) {
        setExpandedJsons((prev) => ({ ...prev, [aigcLogId]: null }));
      } else {
        try {
          // fetch 请求 AIGC log
          const res = await fetch(url);
          const json = await res.json();
          setExpandedJsons((prev) => ({ ...prev, [aigcLogId]: json }));
        } catch {
          setExpandedJsons((prev) => ({
            ...prev,
            [aigcLogId]: [{ role: 'system', content: '❌ 加载失败' }],
          }));
        }
      }
    };

    return (
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button as="a" href={url} size="sm" variant="primary">
            ⬇️ 下载 AIGC记录
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleJson}
          >
            {isExpanded ? '🔽 收起内容' : '📖 展开查看内容'}
          </Button>
        </div>

        <AnimatePresence>
          {Array.isArray(isExpanded) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 border rounded-xl p-4 bg-gray-50/70 dark:bg-gray-900/50 
                         max-h-96 overflow-y-auto space-y-3 backdrop-blur-sm"
            >
              {isExpanded.map((entry, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: entry.role === 'user' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`max-w-[75%] px-4 py-2 rounded-xl shadow-sm text-sm whitespace-pre-wrap 
                    ${entry.role === 'user'
                        ? 'bg-blue-100/80 dark:bg-blue-900/40 self-start text-left ml-2'
                        : 'bg-green-100/80 dark:bg-green-900/40 self-end text-right mr-2'}`}
                >
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {entry.role === 'user' ? '🧑 学生提问' : '🤖 AI 回复'}
                  </div>
                  {entry.content}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">加载中...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto relative">

        <Button
          variant="secondary"
          size="sm"
          className="absolute top-0 right-0"
          onClick={() => navigate('/teacher')}
        >
          👈 返回教师首页
        </Button>

        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          📄 提交记录
        </h1>

        {submissions.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600 dark:text-gray-400 text-center py-10"
          >
            暂无学生提交。
          </motion.p>
        ) : (
          <ul className="space-y-6">
            {submissions.map((s) => {
              const isMissingFile = !s.fileId;
              return (
                <motion.li
                  key={s._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl shadow-md space-y-3 border 
                    transition hover:shadow-lg backdrop-blur-sm
                    ${isMissingFile 
                        ? "bg-red-50/70 dark:bg-red-900/20 border-red-200 dark:border-red-700" 
                        : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"}`}
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <strong>👤 学生:</strong> {s.student?.email || '未知'}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <strong>📅 提交时间:</strong>{' '}
                    {new Date(s.submittedAt).toLocaleString()}
                  </p>

                  {s.fileId ? ( // 检查 fileId
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📎 作业文件:</p>
                      {/* ⚠️ 这里传入文件ID和文件名 */}
                      {renderFileLinks(s.fileId, s.fileName)}
                    </div>
                  ) : (
                    <p className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                      ❌ 学生未提交作业文件
                    </p>
                  )}

                  {s.aigcLogId && ( // 检查 aigcLogId
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-1">
                        🤖 AIGC 原始记录:
                      </p>
                      {/* ⚠️ 这里传入 AIGC Log 的文件ID */}
                      {renderAIGCLog(s.aigcLogId)}
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherTaskSubmissions;
