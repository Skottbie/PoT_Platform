// client/src/components/LazyImageGrid.jsx

import { useState } from 'react';
import LazyImage from './LazyImage';
import Modal from 'react-modal';
import { ImageUp, Loader2, AlertTriangle } from 'lucide-react';

const LazyImageGrid = ({ 
  imageIds = [], 
  title = "提交图片",
  gridClassName = "flex flex-wrap gap-2",
  imageClassName = "w-24 h-24 rounded-lg overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentImageId, setCurrentImageId] = useState('');
  const [modalLoading, setModalLoading] = useState(false); // 🆕 Modal加载状态
  const [modalError, setModalError] = useState(false); // 🆕 Modal错误状态

  if (!imageIds || imageIds.length === 0) {
    return null;
  }

  // 🆕 优化后的打开Modal函数 - 异步加载原图
  const openModal = async (imageUrl, imageId) => {
    setCurrentImageUrl('');
    setCurrentImageId(imageId);
    setModalIsOpen(true);
    setModalLoading(true);
    setModalError(false);

    try {
      // 设置原图URL（LazyImage已经在handleClick中处理了加载）
      setCurrentImageUrl(imageUrl);
    } catch (error) {
      console.error('Modal加载图片失败:', error);
      setModalError(true);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setModalLoading(false);
    setModalError(false);
    // 延迟清理，避免闪烁
    setTimeout(() => {
      setCurrentImageUrl('');
      setCurrentImageId('');
    }, 300);
  };

  // 🆕 Modal内容渲染
  const renderModalContent = () => {
    if (modalLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="text-lg">加载原图中...</p>
          <p className="text-sm opacity-75 mt-2">图片ID: {currentImageId}</p>
        </div>
      );
    }

    if (modalError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-lg">图片加载失败</p>
          <button 
            onClick={closeModal}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      );
    }

    if (currentImageUrl) {
      return (
        <>
          {/* 原图显示 */}
          <img 
            src={currentImageUrl} 
            alt="原图预览" 
            className="w-full h-auto object-contain rounded-lg max-h-[80vh]"
            style={{ maxWidth: '100%' }}
            onLoad={() => setModalLoading(false)}
            onError={() => {
              setModalError(true);
              setModalLoading(false);
            }}
          />
          
          {/* 图片信息 */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            图片ID: {currentImageId}
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="mt-4">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center whitespace-nowrap">
        <ImageUp className="w-4 h-4 mr-2" /> {title} ({imageIds.length})
      </p>
      
      <div className={gridClassName}>
        {imageIds.map((imageId, index) => (
          <LazyImage
            key={imageId}
            imageId={imageId}
            alt={`${title} ${index + 1}`}
            className={imageClassName}
            onClick={openModal}
            loadStrategy="progressive"
            thumbnailSize={150} // 稍大一点的缩略图
          />
        ))}
      </div>

      {/* 🆕 优化后的图片预览模态框 */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="图片预览"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
            // 🆕 确保模态框在移动端也能正确居中
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          content: {
            position: 'relative',
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            margin: '0',
            transform: 'none',
            border: 'none',
            background: 'transparent',
            padding: '0',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90%',
            overflow: 'visible',
          },
        }}
      >
        <div className="relative">
          {/* 关闭按钮 */}
          <button 
            onClick={closeModal}
            className="absolute -top-2 -right-2 text-white text-2xl font-bold bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full w-10 h-10 flex items-center justify-center z-20 transition-all shadow-lg"
          >
            &times;
          </button>
          
          {/* 🆕 动态内容渲染 */}
          {renderModalContent()}
        </div>
      </Modal>
    </div>
  );
};

export default LazyImageGrid;