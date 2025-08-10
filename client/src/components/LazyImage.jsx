// client/src/components/LazyImage.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axiosInstance';

const LazyImage = ({ 
  imageId, 
  alt = "图片", 
  className = "", 
  onClick,
  thumbnailSize = 200,
  previewWidth = 800,
  loadStrategy = 'progressive' // 'progressive' | 'thumbnail' | 'preview' | 'full'
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [loadingStage, setLoadingStage] = useState('idle'); // 'idle' | 'loading' | 'thumbnail' | 'preview' | 'full' | 'error'
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  
  const imgRef = useRef();
  const observerRef = useRef();
  const imageCache = useRef(new Map()); // 本地缓存

  // 生成图片URL (直接使用完整URL，避免axios baseURL影响)
  const getImageUrl = useCallback((type, params = {}) => {
    // 获取API基础路径，如果是/api则直接用/download
    const getDownloadUrl = (imageId) => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.potacademy.net/api';
      if (apiBase === '/api') {
        // 本地环境，直接用/download，会被Nginx代理到后端
        return `/download/${imageId}`;
      } else {
        // 生产环境，使用完整URL
        return `${apiBase}/download/${imageId}`;
      }
    };
    const baseUrl = getDownloadUrl(imageId);
    switch (type) {
      case 'thumbnail':
        return `${baseUrl}/thumbnail?size=${params.size || thumbnailSize}`;
      case 'preview':
        return `${baseUrl}/preview?width=${params.width || previewWidth}`;
      case 'full':
        return baseUrl;
      default:
        return baseUrl;
    }
  }, [imageId, thumbnailSize, previewWidth]);

  // 获取图片Blob URL（带缓存）
  const fetchImageBlob = useCallback(async (type, params = {}) => {
    const url = getImageUrl(type, params);
    const cacheKey = `${imageId}_${type}_${JSON.stringify(params)}`;
    
    // 检查缓存
    if (imageCache.current.has(cacheKey)) {
      return imageCache.current.get(cacheKey);
    }

    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = URL.createObjectURL(blob);
      
      // 缓存结果
      imageCache.current.set(cacheKey, blobUrl);
      
      return blobUrl;
    } catch (error) {
      console.error(`加载${type}图片失败:`, error);
      throw error;
    }
  }, [imageId, getImageUrl]);

  // Intersection Observer 设置
  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // 开始加载后就不再观察
          observerRef.current?.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // 渐进式加载逻辑
  useEffect(() => {
    if (!isInView) return;

    const loadImage = async () => {
      try {
        setError(false);

        if (loadStrategy === 'progressive') {
          // 渐进式加载：缩略图 -> 预览图 -> 原图（点击时）
          
          // 第一步：加载缩略图
          if (loadingStage === 'idle') {
            setLoadingStage('loading');
            const thumbnailUrl = await fetchImageBlob('thumbnail');
            setCurrentSrc(thumbnailUrl);
            setLoadingStage('thumbnail');

            // 延迟一点后加载预览图
            setTimeout(async () => {
              try {
                const previewUrl = await fetchImageBlob('preview');
                setCurrentSrc(previewUrl);
                setLoadingStage('preview');
              } catch (err) {
                console.warn('预览图加载失败，保持缩略图');
              }
            }, 100);
          }
        } else {
          // 直接加载指定尺寸
          setLoadingStage('loading');
          let imageUrl;
          
          switch (loadStrategy) {
            case 'thumbnail':
              imageUrl = await fetchImageBlob('thumbnail');
              break;
            case 'preview':
              imageUrl = await fetchImageBlob('preview');
              break;
            case 'full':
              imageUrl = await fetchImageBlob('full');
              break;
            default:
              imageUrl = await fetchImageBlob('thumbnail');
          }
          
          setCurrentSrc(imageUrl);
          setLoadingStage(loadStrategy);
        }
      } catch (err) {
        console.error('图片加载失败:', err);
        setError(true);
        setLoadingStage('error');
      }
    };

    loadImage();
  }, [isInView, loadStrategy, loadingStage, fetchImageBlob]);

  // 点击加载原图
  const handleClick = useCallback(async (e) => {
    if (onClick) {
      // 如果还没有加载原图，先加载
      if (loadingStage !== 'full') {
        try {
          const fullImageUrl = await fetchImageBlob('full');
          onClick(fullImageUrl, imageId, e);
        } catch (err) {
          console.error('原图加载失败:', err);
          onClick(currentSrc, imageId, e); // 使用当前图片
        }
      } else {
        onClick(currentSrc, imageId, e);
      }
    }
  }, [onClick, imageId, currentSrc, loadingStage, fetchImageBlob]);

  // 组件卸载时清理blob URL
  useEffect(() => {
    return () => {
      if (currentSrc && currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
      }
    };
  }, [currentSrc]);

  // 渲染loading状态
  const renderPlaceholder = () => (
    <div className={`${className} flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse`}>
      <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 4-4v6z" />
      </svg>
    </div>
  );

  // 渲染错误状态
  const renderError = () => (
    <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500`}>
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        <path d="M3 3l14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );

  if (error) {
    return renderError();
  }

  if (!isInView || loadingStage === 'idle' || loadingStage === 'loading') {
    return (
      <div ref={imgRef} className={className}>
        {renderPlaceholder()}
      </div>
    );
  }

  return (
    <div ref={imgRef} className="relative">
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          loadingStage === 'thumbnail' ? 'opacity-80' : 'opacity-100'
        }`}
        onClick={handleClick}
        onError={() => setError(true)}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
      
      {/* 加载指示器 */}
      {loadingStage === 'thumbnail' && loadStrategy === 'progressive' && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default LazyImage;