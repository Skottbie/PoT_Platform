// client/src/components/ReasoningToggle.jsx
import { useCallback } from 'react';
import { useHapticFeedback } from '../hooks/useDeviceDetetion';

const ReasoningToggle = ({ 
  showReasoning, 
  setShowReasoning, 
  isMobile = false, 
  position = 'default' 
}) => {
  const haptic = useHapticFeedback();

  const handleToggle = useCallback((e) => {
    e.preventDefault(); // 阻止默认行为
    e.stopPropagation(); // 阻止事件冒泡
    setShowReasoning(!showReasoning);
    haptic.light();
  }, [showReasoning, setShowReasoning, haptic]);

  // 根据位置和设备类型调整样式
  const getToggleStyles = () => {
    const baseStyles = "flex items-center gap-2 transition-all duration-200 active:scale-95";
    
    if (isMobile) {
      if (position === 'fullscreen-mobile') {
        // 移动端全屏模式：在AI选择器下拉箭头右侧
        return `${baseStyles} ml-2`;
      } else {
        // 移动端非全屏模式：在"选择AI模型"标题右侧
        return `${baseStyles} ml-auto`;
      }
    } else {
      if (position === 'fullscreen-desktop') {
        // 桌面端全屏模式：在AI选择器左侧
        return `${baseStyles} mr-3`;
      } else {
        // 桌面端非全屏模式：在"选择AI模型"标题右侧
        return `${baseStyles} ml-auto`;
      }
    }
  };

  // 根据不同场景显示不同的标签文本
  const shouldShowLabel = () => {
    if (isMobile && position === 'fullscreen-mobile') {
      return false; // 移动端全屏模式不显示文字
    }
    return true; // 其他情况都显示文字
  };

  return (
    <button
      type="button"  // 明确指定按钮类型，防止表单提交
      onClick={handleToggle}
      className={getToggleStyles()}
      title={showReasoning ? "隐藏思考过程" : "显示思考过程"}
    >
      {/* 开关滑块 */}
      <div className={`relative w-10 h-6 rounded-full transition-all duration-200 ${
        showReasoning 
          ? 'bg-blue-500 dark:bg-blue-600' 
          : 'bg-gray-300 dark:bg-gray-600'
      }`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
          showReasoning ? 'left-4' : 'left-0.5'
        }`} />
      </div>
      
      {/* 标签文字 */}
      {shouldShowLabel() && (
        <span className={`text-sm font-medium transition-colors duration-200 ${
          isMobile 
            ? 'text-gray-700 dark:text-gray-300' 
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          思考过程
        </span>
      )}
    </button>
  );
};

export default ReasoningToggle;