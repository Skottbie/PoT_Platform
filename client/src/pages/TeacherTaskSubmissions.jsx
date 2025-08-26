// client/src/pages/TeacherTaskSubmissions.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import LazyImageGrid from '../components/LazyImageGrid';
import toast from 'react-hot-toast';
import PullToRefreshContainer from '../components/PullToRefreshContainer';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { createPortal } from 'react-dom';

import { 
  FileText,
  User, 
  Clock,
  AlertTriangle,
  Paperclip,
  X,
  Eye,
  Download,
  MessageCircle,
  Star,
  BarChart3,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageSquareText,
  Type 
} from 'lucide-react';

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
    studentDisplay: '',
    currentFeedback: null
  });
  const [feedbackForm, setFeedbackForm] = useState({
    content: '',
    rating: 0
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [collapsedSubmissions, setCollapsedSubmissions] = useState({});

  // 格式化学生显示信息
  const formatStudentDisplay = (student) => {
    if (!student) return '未知';
    
    const name = student.name;
    const email = student.email;
    
    if (name && email) {
      return `${name}(${email})`;
    } else if (email) {
      return email; // 如果没有姓名，显示邮箱
    } else {
      return '未知';
    }
  };

  // 切换折叠状态
  const toggleSubmissionCollapse = (submissionId) => {
    setCollapsedSubmissions(prev => ({
      ...prev,
      [submissionId]: !prev[submissionId]
    }));
  };

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
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // 🔧 修复：现在可以安全地在 useEffect 中使用这些函数
  useEffect(() => {
    fetchTaskAndSubmissions();
  }, [taskId, navigate]);

  // 在现有的useEffect后面添加：
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
    
    setFeedbackModal({
      isOpen: true,
      submissionId: submission._id,
      studentDisplay: formatStudentDisplay(submission.student),
      currentFeedback: submission.feedback,
    });

    setFeedbackForm({
      content: submission.feedback?.content || '',
      rating: submission.feedback?.rating || 0,
    });
  };

  const closeFeedbackModal = () => {
    // 恢复背景滚动
    document.body.style.overflow = 'unset';
    
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
                className="px-3 py-1 bg-gray-500 rounded-lg text-sm aigc-native-button"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                取消
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm aigc-native-button"
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
                    <Eye className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                    预览文件
                  </Button>
                )}
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDownload(fileId, fileName)}
                  >
                    <Download className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                    下载作业文件 ({fileName})
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
            <Download className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
            下载 AIGC记录
          </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={toggleJson}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                  收起内容
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                  展开查看内容
                </>
              )}
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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">正在加载提交记录...</p>
        </div>
      </div>
    );
  }
  
  return (
    <PullToRefreshContainer 
      onRefresh={handlePullRefresh}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8"
      disabled={loading}
    >
      <div className="max-w-6xl mx-auto relative">
        <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">提交记录</h1>
            </div>
            {/* 显示任务信息 */}
            {task && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>任务：</strong>{task.title}</p>

                <p><strong>截止时间：</strong>{formatDeadline(task.deadline)}</p>
                <p><strong>逾期提交：</strong>{task.allowLateSubmission ? '允许' : '不允许'}</p>
              </div>
            )}

          </div>
          
          <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:gap-2">
            {/* 总览按钮 */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/task/${taskId}/class-status`)}
              className="w-full sm:w-auto"  // 移动端全宽，桌面端自适应
            >
              <BarChart3 className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">提交情况总览</span>
              <span className="sm:hidden">提交情况总览</span>
            </Button>
            
            {/* 返回按钮 */}
            <Button
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/teacher')}
              className="w-full sm:w-auto"  // 移动端全宽，桌面端自适应
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">返回教师首页</span>
              <span className="sm:hidden">返回教师首页</span>
            </Button>
          </div>
        </div>

                                    {/* 📌 显示任务描述 */}
                {task.description && (
                      <div className="mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                          <div className="flex items-start gap-3 mb-3">
                            <MessageSquareText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">任务描述</h2>
                          </div>
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700/50">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>
                  </div>
                )}

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
        const isCollapsed = collapsedSubmissions[s._id] !== false; // 默认折叠
        const hasFeedback = s.feedback && s.feedback.content;
        
        return (
          <motion.li
            key={s._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl shadow-md border transition hover:shadow-lg backdrop-blur-sm overflow-hidden ${
              s.isLateSubmission
                ? "bg-orange-50/70 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700"
                : isMissingFile 
                ? "bg-red-50/70 dark:bg-red-900/20 border-red-200 dark:border-red-700" 
                : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
            }`}
          >
            {/* 折叠状态的紧凑头部 */}
            <div 
              className="p-4 cursor-pointer select-none"
              onClick={() => toggleSubmissionCollapse(s._id)}
            >
              <div className="flex items-center justify-between">
                {/* 左侧：学生信息和状态 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <User className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {formatStudentDisplay(s.student)}
                      </span>
                    </div>
                    
                    {/* 反馈状态标识 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasFeedback ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          <MessageCircle className="w-3 h-3" />
                          已反馈
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          <MessageCircle className="w-3 h-3" />
                          未反馈
                        </span>
                      )}
                      
                      {s.isLateSubmission && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                          <AlertTriangle className="w-3 h-3" />
                          逾期
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 折叠状态下的简要操作按钮 */}
                  {isCollapsed && (
                    <div className="flex items-center gap-2">
{/*                       <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/view-submission/${taskId}?student=${s.student._id}`);
                        }}
                        className="text-xs px-3 py-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        查看
                      </Button> */}
                      
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFeedbackModal(s);
                        }}
                        className="text-xs px-3 py-1"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        反馈
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* 右侧：折叠图标 */}
                <motion.div
                  animate={{ rotate: isCollapsed ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                </motion.div>
              </div>
            </div>
            
            {/* 展开状态的详细内容 */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="border-t border-gray-200 dark:border-gray-600"
                >
                  <div className="p-5 space-y-3">
                    {/* 详细时间信息 */}
                    <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                      <strong>提交时间:</strong>
                      <span>{new Date(s.submittedAt).toLocaleString()}</span>
                    </div>
                    
                    {/* 逾期详细信息 */}
                    {s.isLateSubmission && (
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {formatLateTime(s.lateMinutes)}
                        </span>
                      </div>
                    )}

                    {/* 提交内容 */}
                    {s.content && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          <Type className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                          <span>提交文本:</span>
                        </div>
                        <div className="bg-gray-100/70 dark:bg-gray-900/50 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {s.content}
                        </div>
                      </div>
                    )}

                    {/* 图片内容 */}
                    {s.imageIds && s.imageIds.length > 0 && (
                      <div>
                        {renderImageLinks(s.imageIds)}
                      </div>
                    )}

                    {/* 文件内容 */}
                    {s.fileId && (
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-1">
                          <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                          <span>作业文件:</span>
                        </div>
                        {renderFileLinks(s.fileId, s.fileName)}
                      </div>
                    )}

                    {/* 未提交警告 */}
                    {!s.fileId && !s.content && (!s.imageIds || s.imageIds.length === 0) && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                        <X className="w-4 h-4" strokeWidth={1.5} />
                        <span>学生未提交作业文件或图片</span>
                      </div>
                    )}

                    {/* AIGC记录 */}
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
                      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
                        <div className="flex-1 w-full sm:w-auto">
                          {s.feedback && s.feedback.content ? (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-green-800 dark:text-green-200">教师反馈</span>
                                    {s.feedback.rating && (
                                      <div className="flex items-center gap-1">
                                        {Array.from({ length: s.feedback.rating }, (_, i) => (
                                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                                    {s.feedback.content}
                                  </p>
                                  {s.feedback.createdAt && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      {new Date(s.feedback.createdAt).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              暂无反馈
                            </div>
                          )}
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:gap-2">
{/*                           <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/view-submission/${taskId}?student=${s.student._id}`)}
                            className="w-full sm:w-auto"
                          >
                            <Eye className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                            查看详情
                          </Button> */}
                          
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openFeedbackModal(s)}
                            className="w-full sm:w-auto"
                          >
                            <MessageCircle className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                            {s.feedback && s.feedback.content ? '编辑反馈' : '添加反馈'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
          </ul>
        )}
      </div>
      {/* 原来的代码是直接在return中渲染，现在改为使用Portal */}
      {feedbackModal.isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            style={{ position: 'fixed' }}
            onClick={(e) => e.target === e.currentTarget && closeFeedbackModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {feedbackModal.currentFeedback?.content ? '编辑' : '添加'}反馈
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                学生：{feedbackModal.studentDisplay}
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
                            rating: prev.rating === star ? 0 : star,
                          }));
                        }}
                        className={`transition-all duration-200 hover:scale-110 aigc-native-button ${
                          feedbackForm.rating >= star && feedbackForm.rating !== 0
                            ? 'text-yellow-500'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        <Star 
                          className="w-6 h-6" 
                          strokeWidth={1.5}
                          fill={feedbackForm.rating >= star && feedbackForm.rating !== 0 ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    {feedbackForm.rating === 0 ? (
                      <span>未评分</span>
                    ) : (
                      <>
                        <Star className="w-3 h-3 text-yellow-500 fill-current" strokeWidth={1.5} />
                        <span>{feedbackForm.rating} 星</span>
                      </>
                    )}
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
        </AnimatePresence>,
        document.body
      )}
          
          </PullToRefreshContainer>
        );
      };

export default TeacherTaskSubmissions;