// client/src/components/LazyImageGrid.jsx

import { useState } from 'react';
import LazyImage from './LazyImage';
import Modal from 'react-modal';

const LazyImageGrid = ({ 
  imageIds = [], 
  title = "提交图片",
  gridClassName = "flex flex-wrap gap-2",
  imageClassName = "w-24 h-24 rounded-lg overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentImageId, setCurrentImageId] = useState('');

  if (!imageIds || imageIds.length === 0) {
    return null;
  }

  const openModal = (imageUrl, imageId) => {
    setCurrentImageUrl(imageUrl);
    setCurrentImageId(imageId);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    // 延迟清理，避免闪烁
    setTimeout(() => {
      setCurrentImageUrl('');
      setCurrentImageId('');
    }, 300);
  };

  return (
    <div className="mt-4">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
        📸 {title} ({imageIds.length})
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

      {/* 图片预览模态框 */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="图片预览"
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
        <div className="relative">
          {/* 关闭按钮 */}
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center z-10 hover:bg-opacity-70 transition-all"
          >
            &times;
          </button>
          
          {/* 原图显示 */}
          {currentImageUrl && (
            <img 
              src={currentImageUrl} 
              alt="原图预览" 
              className="w-full h-auto object-contain rounded-lg max-h-[80vh]"
              style={{ maxWidth: '100%' }}
            />
          )}
          
          {/* 图片信息 */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            图片ID: {currentImageId}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LazyImageGrid;