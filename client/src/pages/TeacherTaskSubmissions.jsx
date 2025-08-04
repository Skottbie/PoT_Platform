// client/src/pages/TeacherTaskSubmissions.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from 'react-modal'; // 📌 新增：引入模态框组件

// 📌 新增：为 react-modal 设置根元素，这对于无障碍访问是必需的
Modal.setAppElement('#root');

const TeacherTaskSubmissions = () => {
  const { taskId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJsons, setExpandedJsons] = useState({});
  const navigate = useNavigate();

  // 📌 新增：管理模态框状态和当前图片 URL
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get(`/submission/by-task/${taskId}`);
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

  // 📌 保持不变：下载文件函数
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

  // 📌 修改：渲染图片缩略图，点击后打开模态框
  const renderImageLinks = (imageIds) => {
    if (!imageIds || imageIds.length === 0) return null;
    
    // 📌 移除 handleImagePreview，使用新逻辑
    const openModal = (imageId) => {
        const imageUrl = `${api.defaults.baseURL}/download/${imageId}`;
        setCurrentImageUrl(imageUrl);
        setModalIsOpen(true);
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
              <img
                src={`${api.defaults.baseURL}/download/${imageId}`}
                alt="学生提交的图片"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 📌 保持不变：渲染 AIGC 日志
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
              const isMissingFile = !s.fileId && !s.content && (!s.imageIds || s.imageIds.length === 0);
              return (
                <motion.li
                  key={s._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl shadow-md space-y-3 border transition hover:shadow-lg backdrop-blur-sm ${isMissingFile ? "bg-red-50/70 dark:bg-red-900/20 border-red-200 dark:border-red-700" : "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"}`}
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <strong>👤 学生:</strong> {s.student?.email || '未知'}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <strong>📅 提交时间:</strong>{' '}
                    {new Date(s.submittedAt).toLocaleString()}
                  </p>
                  
                  {s.content && (
                    <div className="mt-4">
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">📝 提交文本:</p>
                      <div className="bg-gray-100/70 dark:bg-gray-900/50 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {s.content}
                      </div>
                    </div>
                  )}

                  {/* 📌 修改：调用新函数 */}
                  {renderImageLinks(s.imageIds)}

                  {s.fileId ? (
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-1">📎 作业文件:</p>
                      {renderFileLinks(s.fileId, s.fileName)}
                    </div>
                  ) : (
                    !s.content && (!s.imageIds || s.imageIds.length === 0) && (
                      <p className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        ❌ 学生未提交作业文件
                      </p>
                    )
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

      {/* 📌 新增：模态框组件 */}
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