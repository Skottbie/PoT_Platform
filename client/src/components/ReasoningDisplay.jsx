// client/src/components/ReasoningDisplay.jsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ReasoningDisplay = ({ 
  reasoningContent, 
  finalAnswer, 
  isFullscreen = false,
  isMobile = false,
  getMarkdownComponents 
}) => {
  const [isExpanded, setIsExpanded] = useState(isFullscreen); // 全屏模式默认展开

  // 🔧 修复：确保即使没有reasoning_content也要显示finalAnswer
  if (!reasoningContent || reasoningContent.trim() === '') {
    // 没有思考过程，只显示普通回答
    return (
      <div className="aigc-chat-content">
        <ReactMarkdown
          components={getMarkdownComponents(false)}
          remarkPlugins={[remarkGfm]}
        >
          {finalAnswer || ''}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 思考过程区域 */}
      <div className={`${
        isMobile 
          ? 'bg-blue-50/60 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-700/20' 
          : 'bg-purple-50/60 dark:bg-purple-900/20 rounded-xl border border-purple-200/30 dark:border-purple-700/20'
      }`}>
        {/* 折叠/展开头部 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between p-3 text-left transition-colors duration-200 ${
            isMobile
              ? 'hover:bg-blue-100/50 dark:hover:bg-blue-800/30'
              : 'hover:bg-purple-100/50 dark:hover:bg-purple-800/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-lg ${isMobile ? '🧠' : '🤔'}`}>
              {isMobile ? '🧠' : '🤔'}
            </span>
            <span className={`font-medium ${
              isMobile 
                ? 'text-blue-700 dark:text-blue-300 text-sm' 
                : 'text-purple-700 dark:text-purple-300 text-base'
            }`}>
              思考过程
            </span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            } ${isMobile ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 可折叠的思考内容 */}
        {isExpanded && (
          <div className={`border-t border-current/10 ${isMobile ? 'p-3 pt-3' : 'p-4 pt-3'}`}>
            <div className={`${
              isMobile 
                ? 'text-sm text-blue-900 dark:text-blue-100' 
                : 'text-base text-purple-900 dark:text-purple-100'
            } aigc-chat-content`}>
              <ReactMarkdown
                components={getMarkdownComponents(false)}
                remarkPlugins={[remarkGfm]}
              >
                {reasoningContent}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* 最终答案区域 */}
      <div>
        <div className={`flex items-center gap-2 mb-2 ${
          isMobile ? 'text-xs' : 'text-sm'
        } text-green-700 dark:text-green-300 font-medium`}>
          <span>✅</span>
          <span>最终答案</span>
        </div>
        <div className="aigc-chat-content">
          <ReactMarkdown
            components={getMarkdownComponents(false)}
            remarkPlugins={[remarkGfm]}
          >
            {finalAnswer}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ReasoningDisplay;