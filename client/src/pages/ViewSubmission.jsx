// client/src/pages/ViewSubmission.jsx - 移动端优化版本

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion } from 'framer-motion';
import LazyImageGrid from '../components/LazyImageGrid';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import toast from 'react-hot-toast'; // 📌 使用 toast 替代 alert
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useCallback } from 'react';

const ViewSubmission = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAigc, setExpandedAigc] = useState(false);
  const [aigcContent, setAigcContent] = useState(null);

  useEffect(() => {
    fetchSubmissionAndTask();
  }, [taskId]);

  const fetchSubmissionAndTask = async () => {
    try {
      setLoading(true);
      
      // 并行获取任务信息和提交记录
      const [taskRes, submissionRes] = await Promise.all([
        api.get(`/task/${taskId}`),
        api.get(`/submission/my/${taskId}`)
      ]);
      
      setTask(taskRes.data);
      setSubmission(submissionRes.data);
    } catch (err) {
      console.error('获取数据失败:', err);
      if (err.response?.status === 404) {
        navigate('/student');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLateTime = (lateMinutes) => {
    if (lateMinutes < 60) {
      return `逾期 ${lateMinutes} 分钟`;
    } else if (lateMinutes < 1440) {
      const hours = Math.floor(lateMinutes / 60);
      const minutes = lateMinutes % 60;
      return `逾期 ${hours} 小时${minutes > 0 ? ` ${minutes} 分钟` : ''}`;
    } else {
      const days = Math.floor(lateMinutes / 1440);
      const hours = Math.floor((lateMinutes % 1440) / 60);
      return `逾期 ${days} 天${hours > 0 ? ` ${hours} 小时` : ''}`;
    }
  };

  // 下载文件
  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/download/${fileId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('文件下载失败，请重试。');
    }
  };

  // 展开/收起 AIGC 记录
  const toggleAigcContent = async () => {
    if (expandedAigc) {
      setExpandedAigc(false);
      setAigcContent(null);
    } else {
      try {
        const res = await api.get(`/download/${submission.aigcLogId}`);
        setAigcContent(res.data);
        setExpandedAigc(true);
      } catch (error) {
        console.error('AIGC 记录加载失败:', error);
        setAigcContent([{ role: 'system', content: '❌ 加载失败' }]);
        setExpandedAigc(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">加载中...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">您还没有提交此任务</p>
          <Button variant="primary" onClick={() => navigate('/student')}>
            返回任务列表
          </Button>
        </div>
      </div>
    );
  }

  const handlePullRefresh = useCallback(async () => {
    try {
      const [taskRes, submissionRes] = await Promise.all([
        api.get(`/task/${taskId}`),
        api.get(`/submission/my/${taskId}`)
      ]);
      setTask(taskRes.data);
      setSubmission(submissionRes.data);
      toast.success('刷新成功');
    } catch (err) {
      console.error('刷新失败:', err);
      toast.error('刷新失败，请重试');
    }
  }, [taskId]); // 🔧 只依赖 taskId

  // 查看提交页面，主要等待教师反馈
  useAutoRefresh(handlePullRefresh, {
    interval: 120000, // 2分钟
    enabled: true,
    pauseOnHidden: true,
  });

  return (
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-10 px-2 sm:px-4"
      disabled={loading}
    >
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-10 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* 📌 移动端优化：页面头部 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 break-words">
              📄 我的提交记录
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
              任务：{task?.title}
            </p>
            {/* 📌 添加任务描述显示 */}
            {task?.description && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  📋 任务说明
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {task.description}
                </p>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/student')}
              className="w-full sm:w-auto"
            >
              👈 返回任务列表
            </Button>
          </div>
        </div>

        {/* 提交记录卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 sm:p-6 space-y-6 border ${
            submission.isLateSubmission
              ? 'border-orange-200 dark:border-orange-700'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          {/* 📌 移动端优化：提交状态和教师反馈 */}
          <div className="space-y-4">
            {/* 提交状态 */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    ✅ 已提交
                  </span>
                  {submission.isLateSubmission && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                      ⚠️ 逾期提交
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  提交时间：{formatDate(submission.submittedAt)}
                </p>
                {submission.isLateSubmission && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {formatLateTime(submission.lateMinutes)}
                  </p>
                )}
              </div>
            </div>
            
            {/* 📌 移动端优化：教师反馈显示 - 独立一行，避免挤压 */}
            {submission.feedback && (
              <div className="w-full">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                      💬 教师反馈
                    </span>
                    {submission.feedback.rating && (
                      <span className="text-yellow-500">
                        {'⭐'.repeat(submission.feedback.rating)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 break-words">
                    {submission.feedback.content}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    反馈时间：{formatDate(submission.feedback.createdAt)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 提交内容 */}
          {submission.content && (
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                📝 文字内容
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                {submission.content}
              </div>
            </div>
          )}

          {/* 提交图片 */}
          {submission.imageIds && submission.imageIds.length > 0 && (
            <div>
              <LazyImageGrid
                imageIds={submission.imageIds}
                title="提交图片"
                gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4"
                imageClassName="w-full h-24 sm:h-32 rounded-lg overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
              />
            </div>
          )}

          {/* 作业文件 */}
          {submission.fileId && (
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                📎 作业文件
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm text-gray-800 dark:text-gray-200 break-all">
                    {submission.fileName}
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDownload(submission.fileId, submission.fileName)}
                    className="w-full sm:w-auto flex-shrink-0"
                  >
                    ⬇️ 下载
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 📌 移动端优化：AIGC 记录 */}
          {submission.aigcLogId && (
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                  🤖 AIGC 对话记录
                </h3>
                {/* 📌 移动端优化：按钮布局 */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleAigcContent}
                    className="w-full sm:w-auto"
                  >
                    {expandedAigc ? '🔽 收起内容' : '📖 展开查看'}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDownload(submission.aigcLogId, 'aigc_log.json')}
                    className="w-full sm:w-auto"
                  >
                    ⬇️ 下载记录
                  </Button>
                </div>
              </div>
              
              {expandedAigc && aigcContent && Array.isArray(aigcContent) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 max-h-80 sm:max-h-96 overflow-y-auto space-y-3"
                >
                  {aigcContent.map((entry, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: entry.role === 'user' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2 rounded-xl text-sm whitespace-pre-wrap break-words ${
                        entry.role === 'user' 
                          ? 'bg-blue-100 dark:bg-blue-900/40 self-start ml-1 sm:ml-2' 
                          : 'bg-green-100 dark:bg-green-900/40 self-end mr-1 sm:mr-2'
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        {entry.role === 'user' ? '🧑 我的提问' : '🤖 AI 回复'}
                      </div>
                      <ReactMarkdown
                        components={{
                          code({ inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline ? (
                              <SyntaxHighlighter
                                style={github}
                                language={match ? match[1] : 'text'}
                                PreTag="div"
                                className="rounded-lg my-1 overflow-x-auto text-xs"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded text-xs break-all">
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {entry.content}
                      </ReactMarkdown>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </PullToRefreshContainer>
  );
};

export default ViewSubmission;