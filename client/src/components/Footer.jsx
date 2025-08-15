// client/src/components/Footer.jsx
import React, { useState } from 'react';

const Footer = ({ variant = 'elegant', className = '' }) => {
  const [hoveredLink, setHoveredLink] = useState(null);

  // 优雅简约风格 (推荐)
  const ElegantFooter = () => (
    <footer className={`mt-auto ${className}`}>
      <div className="relative">
        {/* 简洁分割线 */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>
        
        <div className="py-6 sm:py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              
              {/* 版权信息 - 主要层级 */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  © 2025 PoTAcademy. All rights reserved.
                </p>
              </div>
              
              {/* ICP备案 - 次要层级，符合法规 */}
              <div className="text-center">
                <a 
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200"
                >
                  <span className="font-mono tracking-wider">
                    粤ICP备2025458271号-1
                  </span>
                </a>
              </div>
              
            </div>
          </div>
        </div>
        
        {/* 移动端安全区域 */}
        <div className="safe-bottom sm:pb-0"></div>
      </div>
    </footer>
  );

  // 现代卡片风格
  const ModernCardFooter = () => (
    <footer className={`mt-auto ${className}`}>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              
              {/* 版权信息 */}
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  © 2025 PoTAcademy All rights reserved.
                </p>
              </div>
              
              {/* ICP备案 */}
              <div className="text-center sm:text-right">
                <a 
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200"
                >
                  <span className="font-mono">粤ICP备2024XXXXXX号</span>
                </a>
              </div>
              
            </div>
          </div>
        </div>
        
        <div className="safe-bottom sm:pb-0"></div>
      </div>
    </footer>
  );

  // 极简主义风格
  const MinimalFooter = () => (
    <footer className={`mt-auto ${className}`}>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="py-6">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-2">
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 PoTAcademy All rights reserved.
              </p>
              
              <a 
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 font-mono transition-colors duration-200"
              >
                粤ICP备2024XXXXXX号
              </a>
              
            </div>
          </div>
        </div>
        
        <div className="safe-bottom sm:pb-0"></div>
      </div>
    </footer>
  );

  // 根据variant渲染对应组件
  switch (variant) {
    case 'card':
      return <ModernCardFooter />;
    case 'minimal':
      return <MinimalFooter />;
    default:
      return <ElegantFooter />;
  }
};

export default Footer;