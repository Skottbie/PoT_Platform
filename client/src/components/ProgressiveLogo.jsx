// client/src/components/ProgressiveLogo.jsx - 增强版

import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import logoSmall from '../assets/logo-small.png';
// 如果有WebP版本，优先使用
import logoWebP from '../assets/logo.webp';
import logoSmallWebP from '../assets/logo-small.webp';

const ProgressiveLogo = ({ 
  size = "medium", 
  className = "",
  alt = "PoTAcademy Logo",
  onClick,
  priority = false,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  // 检测浏览器是否支持WebP
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  // 根据尺寸和浏览器支持决定加载策略
  const getSources = () => {
    const webpSupported = supportsWebP();
    
    switch (size) {
      case "small":
        return {
          immediate: webpSupported && logoSmallWebP ? logoSmallWebP : logoSmall,
          final: webpSupported && logoWebP ? logoWebP : logo
        };
      case "large":
        return {
          immediate: webpSupported && logoSmallWebP ? logoSmallWebP : logoSmall,
          final: webpSupported && logoWebP ? logoWebP : logo
        };
      default: // medium
        return {
          immediate: webpSupported && logoSmallWebP ? logoSmallWebP : logoSmall,
          final: webpSupported && logoWebP ? logoWebP : logo
        };
    }
  };

  const sources = getSources();

  useEffect(() => {
    // 立即显示低质量图片
    setCurrentSrc(sources.immediate);

    // 🚀 关键优化：对于Login页面的priority logo，立即开始加载高质量版本
    const loadHighQuality = () => {
      const img = new Image();
      
      img.onload = () => {
        setCurrentSrc(sources.final);
        setIsHighQualityLoaded(true);
      };
      
      img.onerror = () => {
        console.warn('High quality logo failed to load');
        // 如果WebP失败，尝试PNG
        if (sources.final.includes('.webp')) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            setCurrentSrc(logo);
            setIsHighQualityLoaded(true);
          };
          fallbackImg.src = logo;
        }
      };
      
      // 🔥 为Login页面预连接资源
      if (priority) {
        // 预连接到图片域名（如果使用CDN）
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = new URL(sources.final, window.location.origin).origin;
        document.head.appendChild(link);
      }
      
      img.src = sources.final;
    };

    if (priority) {
      // 🚀 优先加载：立即开始，无延迟
      loadHighQuality();
    } else {
      // 延迟加载：给关键资源让路
      const timer = setTimeout(loadHighQuality, 300);
      return () => clearTimeout(timer);
    }
  }, [sources.immediate, sources.final, priority]);

  // 获取尺寸类名
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "w-6 h-6";
      case "large":
        return "w-12 h-12";
      default:
        return "w-8 h-8";
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${getSizeClasses()} ${className} transition-all duration-200 ${
        isHighQualityLoaded ? 'opacity-100' : 'opacity-95'
      }`}
      onClick={onClick}
      loading={priority ? "eager" : "lazy"}
      // 🔥 关键优化：为重要的logo添加fetchpriority
      fetchPriority={priority ? "high" : "auto"}
      // 防止布局偏移
      style={{ 
        objectFit: 'contain',
        minWidth: 'auto',
        minHeight: 'auto'
      }}
      {...props}
    />
  );
};

export default ProgressiveLogo;