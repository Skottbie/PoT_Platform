// client/src/pages/TeacherTaskSubmissions.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from 'react-modal';

Modal.setAppElement('#root');

// 图片加载组件（保持原有实现）
const ImageWithLoading = ({ imageId, fetchImage }) => {
  const [src, setSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadImg = async () => {
      setIsLoading(true);
      try {
        const url = await fetchImage(imageId);
        if (isMounted) {
          setSrc(url);
        }
      } catch (e) {
        if (isMounted) {
          setSrc('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadImg();

    return () => {
      isMounted = false;
    };
  }, [imageId, fetchImage]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse">
        <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 4-4v6z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="学生提交的图片"
      className="w-full h-full object-cover"
      onError={(e) => {
        if (!e.target.src.startsWith('data:')) {
          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
        }
      }}
    />
  );
};

const TeacherTaskSubmissions = () => {
  const { taskId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [task, setTask] = useState(null); // 📌 新增：存储任务信息
  const [loading, setLoading] = useState(true);
  const [expandedJsons, setExpandedJsons] = useState({});
  const navigate = useNavigate();

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState({});

  // 图片加载函数
  const fetchAndCacheImage = async (imageId) => {
    if (imageUrls[imageId]) {
      return imageUrls[imageId];
    }
    try {
      const res = await api.get(`/download/${imageId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = URL.createObjectURL(blob);
      setImageUrls(prev => ({ ...prev, [imageId]: url }));
      return url;
    } catch (error) {
      console.error('图片加载失败:', error);
      throw new Error("图片加载失败");
    }
  };

  useEffect(() => {
    const fetchTaskAndSubmissions = async () => {
      try {
        // 📌 获取任务信息
        const taskRes = await api.get(`/task/${taskId}`);
        setTask(taskRes.data);

        // 获取提交记录
        const res = await api.get(`/submission/by-task/${taskId}`);
        setSubmissions(res.data);
      } catch (err) {
        console.error('获取数据失败', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchTaskAndSubmissions();
  }, [taskId, navigate]);

  // 📌 新增：格式化截止时间
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

  // 📌 新增：格式化逾期时间
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
      alert('文件下载失败，请重试。');
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
            alert('文件预览失败，请重试。');
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

  // 渲染图片缩略图
  const renderImageLinks = (imageIds) => {
    if (!imageIds || imageIds.length === 0) return null;
    
    const openModal = async (imageId) => {
      try {
          const imageUrl = await fetchAndCacheImage(imageId);
          setCurrentImageUrl(imageUrl);
          setModalIsOpen(true);
      } catch (e) {
          alert('图片加载失败，请重试。');
      }
    };
    
    return (
      <div className="mt-4">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📸 提交图片:</p>
        <div className="flex flex-wrap gap-2">
          {imageIds.map((imageId) => (
            <div
              key={imageId}
              onClick={() => openModal(imageId)}
              className="w-24 h-24 rounded-lg overflow-hidden cursor-pointer
                         border border-gray-200 dark:border-gray-700
                         hover:shadow-lg transition-shadow duration-200"
            >
              <ImageWithLoading imageId={imageId} fetchImage={fetchAndCacheImage} />
            </div>
          ))}
        </div>
      </div>
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
              {isExpanded.map((entry, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: entry.role === 'user' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`max-w-[75%] px-4 py-2 rounded-xl shadow-sm text-sm whitespace-pre-wrap ${entry.role === 'user' ? 'bg-blue-100/80 dark:bg-blue-900/40 self-start text-left ml-2' : 'bg-green-100/80 dark:bg-green-900/40 self-end text-right mr-2'}`}
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
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
              📄 提交记录
            </h1>
            {/* 📌 新增：显示任务信息 */}
            {task && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>任务：</strong>{task.title}</p>
                <p><strong>截止时间：</strong>{formatDeadline(task.deadline)}</p>
                <p><strong>逾期提交：</strong>{task.allowLateSubmission ? '允许' : '不允许'}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* 📌 新增：班级提交情况按钮 */}
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
                    
                    {/* 📌 新增：逾期提交标识 */}
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
                        🤖 AIGC 原始记录:
                      </p>
                      {renderAIGCLog(s.aigcLogId)}
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Image Modal"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            background: 'transparent',
            padding: 0,
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90%',
            overflow: 'auto',
          },
        }}
      >
        <button 
          onClick={() => setModalIsOpen(false)}
          className="absolute top-4 right-4 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center z-10"
        >
          &times;
        </button>
        {currentImageUrl && (
          <img src={currentImageUrl} alt="放大图片" className="w-full h-auto object-contain rounded-lg" />
        )}
      </Modal>
    </div>
  );
};

export default TeacherTaskSubmissions;