// client/src/pages/TeacherTaskSubmissions.jsx - 修复版本（关键修改部分）

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import LazyImageGrid from '../components/LazyImageGrid';
import toast from 'react-hot-toast';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';

import { 
  detectPoTMode, 
  getModelDisplayName, 
  getLinearIcons, 
  getPoTBubbleStyles 
} from '../utils/aigcDisplayUtils';
import '../styles/potMode.css'; // 确保引入PoT样式

const TeacherTaskSubmissions = () => {
  const { taskId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedJsons, setExpandedJsons] = useState({});
  const navigate = useNavigate();
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    submissionId: null,
    studentEmail: '',
    currentFeedback: null
  });
  const [feedbackForm, setFeedbackForm] = useState({
    content: '',
    rating: 0
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // 🔧 修复：将 refreshData 函数定义提前，避免初始化错误
  const refreshData = async () => {
    try {
      const res = await api.get(`/submission/by-task/${taskId}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error('刷新数据失败:', err);
      toast.error('刷新数据失败');
    }
  };

  // 🔧 修复：获取初始数据的函数也要提前定义
  const fetchTaskAndSubmissions = async () => {
    try {
      // 获取任务信息
      const taskRes = await api.get(`/task/${taskId}`);
      setTask(taskRes.data);

      // 获取提交记录
      const res = await api.get(`/submission/by-task/${taskId}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error('获取数据失败', err);
      toast.error('获取数据失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 修复：现在可以安全地在 useEffect 中使用这些函数
  useEffect(() => {
    fetchTaskAndSubmissions();
  }, [taskId, navigate]);

  // 🔄 下拉刷新处理函数 - 现在可以安全使用 refreshData
  const handlePullRefresh = async () => {
    try {
      await refreshData();
      toast.success('刷新成功');
    } catch (error) {
      console.error('下拉刷新失败:', error);
      toast.error('刷新失败，请重试');
    }
  };

  // ⏰ 自动定时刷新 - 现在可以安全使用 refreshData
  useAutoRefresh(async () => {
    try {
      // 静默刷新提交数据
      await refreshData();
    } catch (error) {
      console.error('自动刷新失败:', error);
    }
  }, {
    interval: 30000,
    enabled: true,
    pauseOnHidden: true,
    pauseOnOffline: true,
  });

  // 反馈处理函数 - 保持原有逻辑
  const openFeedbackModal = (submission) => {
    setFeedbackModal({
      isOpen: true,
      submissionId: submission._id,
      studentEmail: submission.student?.email || '未知',
      currentFeedback: submission.feedback,
    });

    setFeedbackForm({
      content: submission.feedback?.content || '',
      rating: submission.feedback?.rating || 0,
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      isOpen: false,
      submissionId: null,
      studentEmail: '',
      currentFeedback: null,
    });
    setFeedbackForm({
      content: '',
      rating: 0,
    });
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (!feedbackForm.content.trim()) {
      toast.error('请输入反馈内容');
      return;
    }

    setSubmittingFeedback(true);

    try {
      const res = await api.post(`/submission/${feedbackModal.submissionId}/feedback`, {
        content: feedbackForm.content.trim(),
        rating: feedbackForm.rating === 0 ? null : feedbackForm.rating,
      });

      if (res.data.success) {
        toast.success('反馈提交成功！');
        closeFeedbackModal();
        // 🔧 修复：使用正确的刷新函数
        await refreshData();
      } else {
        toast.error('反馈提交失败：' + (res.data.message || '未知错误'));
      }
    } catch (err) {
      console.error('提交反馈失败:', err);
      toast.error('反馈提交失败：' + (err.response?.data?.message || '网络错误'));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDeleteFeedback = async (submissionId) => {
    // 使用自定义确认弹窗替代原生 confirm
    const confirmDelete = () => {
      return new Promise((resolve) => {
        toast((t) => (
          <div className="flex flex-col gap-3">
            <p>确定要删除这条反馈吗？</p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1 bg-gray-200 rounded text-sm"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                取消
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                删除
              </button>
            </div>
          </div>
        ), {
          duration: Infinity,
          style: { maxWidth: '300px' }
        });
      });
    };

    const confirmed = await confirmDelete();
    if (!confirmed) return;

    try {
      const res = await api.delete(`/submission/${submissionId}/feedback`);
      
      if (res.data.success) {
        toast.success('反馈已删除！');
        await refreshData(); // 🔧 使用正确的刷新函数
      } else {
        toast.error('删除失败：' + (res.data.message || '未知错误'));
      }
    } catch (err) {
      console.error('删除反馈失败:', err);
      toast.error('删除失败：' + (err.response?.data?.message || '网络错误'));
    }
  };

  // 格式化截止时间
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

  // 格式化逾期时间
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

  // 下载文件函数
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

  const renderFileLinks = (fileId, fileName) => {
    const isPreviewable = /\.(pdf|jpg|jpeg|png|gif)$/i.test(fileName);
  
    const handlePreview = async (fileId) => {
        try {
            const res = await api.get(`/download/${fileId}`, {
                responseType: 'blob',
            });
            const blob = new Blob([res.data], { type: res.headers['content-type'] });
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (error) {
            console.error('预览失败:', error);
            toast.error('文件预览失败，请重试。');
        }
    };
  
    return (
        <div className="space-y-2 text-sm mt-1">
            <div className="flex flex-wrap gap-2">
                {isPreviewable && (
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handlePreview(fileId)}
                    >
                        🔍 预览文件
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDownload(fileId, fileName)}
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

  // 渲染图片网格（使用懒加载）
  const renderImageLinks = (imageIds) => {
    if (!imageIds || imageIds.length === 0) return null;
    
    return (
      <LazyImageGrid
        imageIds={imageIds}
        title="提交图片"
        gridClassName="flex flex-wrap gap-2"
        imageClassName="w-24 h-24 rounded-lg overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
      />
    );
  };
  
  // 渲染 AIGC 日志
  const renderAIGCLog = (aigcLogId) => {
    const isExpanded = expandedJsons[aigcLogId];
    const toggleJson = async () => {
      if (isExpanded) {
        setExpandedJsons((prev) => ({ ...prev, [aigcLogId]: null }));
      } else {
        try {
          const res = await api.get(`/download/${aigcLogId}`);
          setExpandedJsons((prev) => ({ ...prev, [aigcLogId]: res.data }));
        } catch (error) {
          console.error('AIGC 记录加载失败:', error);
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
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleDownload(aigcLogId, 'aigc_log.json')}
          >
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
              className="mt-3 border rounded-xl p-4 bg-gray-50/70 dark:bg-gray-900/50 max-h-96 overflow-y-auto space-y-3 backdrop-blur-sm"
            >
              {(() => {
                const isPoTMode = detectPoTMode(isExpanded);
                
                return (
                  <>
                    {/* PoT Mode 标识 */}
                    {isPoTMode && (
                      <div className="flex items-center justify-center mb-4 p-2 rounded-lg bg-gradient-to-r from-amber-100/50 to-rose-100/50 dark:from-purple-800/30 dark:to-indigo-800/30 border border-amber-200/50 dark:border-purple-500/30">
                        <span className="text-sm font-medium text-amber-700 dark:text-purple-300 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          PoT-Mode ON
                        </span>
                      </div>
                    )}
                    
                    {/* 对话记录 */}
                    {isExpanded.map((entry, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: entry.role === 'user' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`max-w-[75%] px-4 py-2 rounded-xl shadow-sm text-sm whitespace-pre-wrap ${
                          getPoTBubbleStyles(entry.role, isPoTMode)
                        } ${
                          entry.role === 'user' 
                            ? 'self-start text-left ml-2' 
                            : 'self-end text-right mr-2'
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                          {entry.role === 'user' ? (
                            <>
                              {getLinearIcons().user}
                              <span>学生提问</span>
                            </>
                          ) : (
                            <>
                              {getLinearIcons().ai}
                              <span>{getModelDisplayName(entry.model, entry.potMode || isPoTMode)}</span>
                            </>
                          )}
                        </div>
                        {entry.content}
                      </motion.div>
                    ))}
                  </>
                );
              })()}
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
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8"
      disabled={loading}
    >
      <div className="max-w-4xl mx-auto relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
              📄 提交记录
            </h1>
            {/* 显示任务信息 */}
            {task && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>任务：</strong>{task.title}</p>
                {/* 📌 显示任务描述 */}
                {task.description && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      📋 {task.description}
                    </p>
                  </div>
                )}
                <p><strong>截止时间：</strong>{formatDeadline(task.deadline)}</p>
                <p><strong>逾期提交：</strong>{task.allowLateSubmission ? '允许' : '不允许'}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* 班级提交情况按钮 */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/task/${taskId}/class-status`)}
            >
              📊 班级提交情况
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/teacher')}
            >
              👈 返回教师首页
            </Button>
          </div>
        </div>

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
              const isMissingFile = !s.fileId && !s.content && (!s.imageIds || s.imageIds.length === 0);
              return (
                <motion.li
                  key={s._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl shadow-md space-y-3 border transition hover:shadow-lg backdrop-blur-sm ${
                    s.isLateSubmission
                      ? "bg-orange-50/70 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700"
                      : isMissingFile 
                      ? "bg-red-50/70 dark:bg-red-900/20 border-red-200 dark:border-red-700" 
                      : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        <strong>👤 学生:</strong> {s.student?.email || '未知'}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        <strong>📅 提交时间:</strong>{' '}
                        {new Date(s.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* 逾期提交标识 */}
                    {s.isLateSubmission && (
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                          ⚠️ 逾期提交
                        </span>
                        <span className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {formatLateTime(s.lateMinutes)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {s.content && (
                    <div className="mt-4">
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📝 提交文本:</p>
                      <div className="bg-gray-100/70 dark:bg-gray-900/50 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {s.content}
                      </div>
                    </div>
                  )}

                  {s.imageIds && s.imageIds.length > 0 && (
                    <div>
                      {renderImageLinks(s.imageIds)}
                    </div>
                  )}

                  {s.fileId && (
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-1">📎 作业文件:</p>
                      {renderFileLinks(s.fileId, s.fileName)}
                    </div>
                  )}

                  {!s.fileId && !s.content && (!s.imageIds || s.imageIds.length === 0) && (
                    <p className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                      ❌ 学生未提交作业文件或图片
                    </p>
                  )}

                  {s.aigcLogId && (
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-1">
                        <div className="flex items-center gap-2">
                          {getLinearIcons().conversation}
                          <span>AIGC交互原始记录</span>
                        </div>
                      </p>
                      {renderAIGCLog(s.aigcLogId)}
                    </div>
                  )}
                  {/* 教师反馈区域 */}
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {s.feedback && s.feedback.content ? (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                  💬 我的反馈
                                </span>
                                {s.feedback.rating && (
                                  <span className="text-yellow-500">
                                    {'⭐'.repeat(s.feedback.rating)}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteFeedback(s._id)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                删除反馈
                              </button>
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                              {s.feedback.content}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              反馈时间：{new Date(s.feedback.createdAt).toLocaleString()}
                              {s.feedback.updatedAt && s.feedback.updatedAt !== s.feedback.createdAt && (
                                <span> (已编辑)</span>
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            暂无反馈
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openFeedbackModal(s)}
                        >
                          {s.feedback && s.feedback.content ? '📝 编辑反馈' : '💬 添加反馈'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
      <AnimatePresence>
        {feedbackModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeFeedbackModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                💬 {feedbackModal.currentFeedback?.content ? '编辑' : '添加'}反馈
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                学生：{feedbackModal.studentEmail}
              </p>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* 评分选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    评分（可选）
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setFeedbackForm((prev) => ({
                            ...prev,
                            rating: prev.rating === star ? 0 : star, // 点击已选中的星星取消评分
                          }));
                        }}
                        className={`text-2xl transition-colors ${
                          // 📌 修复：正确的星星显示逻辑
                          feedbackForm.rating >= star && feedbackForm.rating !== 0
                            ? 'text-yellow-500'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  {/* 📌 添加评分状态显示 */}
                  <p className="text-xs text-gray-500 mt-1">
                    {feedbackForm.rating === 0 ? '未评分' : `${feedbackForm.rating} 星`}
                  </p>
                </div>

                {/* 反馈内容 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    反馈内容 *
                  </label>
                  <textarea
                    value={feedbackForm.content}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({ ...prev, content: e.target.value }))
                    }
                    rows={4}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入对学生作业的反馈..."
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeFeedbackModal}
                    disabled={submittingFeedback}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submittingFeedback}
                  >
                    {feedbackModal.currentFeedback?.content ? '更新反馈' : '提交反馈'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    
    </PullToRefreshContainer>
  );
};

export default TeacherTaskSubmissions;