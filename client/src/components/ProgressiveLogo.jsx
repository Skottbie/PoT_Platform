// client/src/components/ProgressiveLogo.jsx

import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import logoSmall from '../assets/logo-small.png';
// import logoThumb from '../assets/logo-thumb.webp'; // 如果有的话
// import logoBlur from '../assets/logo-blur.jpg'; // 如果有的话

const ProgressiveLogo = ({ 
  size = "medium", // "small" | "medium" | "large"
  className = "",
  alt = "PoTAcademy Logo",
  onClick,
  priority = false,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  // 根据尺寸决定加载策略
  const getSources = () => {
    switch (size) {
      case "small":
        return {
          immediate: logoSmall, // 立即显示小图
          final: logo // 后台加载高质量图
        };
      case "large":
        return {
          immediate: logoSmall, // 先显示小图
          final: logo
        };
      default: // medium
        return {
          immediate: logoSmall,
          final: logo
        };
    }
  };

  const sources = getSources();

  useEffect(() => {
    // 立即显示低质量图片
    setCurrentSrc(sources.immediate);

    // 预加载高质量图片
    const loadHighQuality = () => {
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(sources.final);
        setIsHighQualityLoaded(true);
      };
      img.onerror = () => {
        // 如果高质量图片加载失败，保持低质量图片
        console.warn('High quality logo failed to load');
      };
      img.src = sources.final;
    };

    if (priority) {
      // 优先加载，立即开始
      loadHighQuality();
    } else {
      // 延迟加载，给其他资源让路
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
      className={`${getSizeClasses()} ${className} transition-all duration-300 ${
        isHighQualityLoaded ? 'opacity-100' : 'opacity-90'
      }`}
      onClick={onClick}
      loading={priority ? "eager" : "lazy"}
      {...props}
    />
  );
};

export default ProgressiveLogo;