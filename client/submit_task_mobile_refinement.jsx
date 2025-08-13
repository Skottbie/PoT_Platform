// 🎯 修改1: 全屏模式配色和布局优化 - 只针对手机端
// 在全屏模式的最外层容器添加手机端样式

{/* 全屏容器 - 添加手机端配色 */}
<div className="fixed inset-0 z-[9999] flex flex-col mobile-fullscreen-container">
  
  {/* 🎯 修改2: 顶部导航栏 - 手机端压缩和透明度优化 */}
  <div className="flex-shrink-0 mobile-topbar">
    <div className="flex items-center justify-between mobile-topbar-content">
      {/* 左侧区域 */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* 字号按钮 - 手机端完全透明 */}
        <button
          onClick={handleFontSizeClick}
          className="mobile-icon-button"
          title="调整字号"
        >
          <div className="flex items-baseline gap-0.5 text-gray-600 dark:text-gray-400">
            <span className="text-xs font-semibold">A</span>
            <span className="text-sm font-semibold">A</span>
          </div>
        </button>
        
        {/* 模型选择 - 手机端透明背景 */}
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            haptic.light();
          }}
          className="mobile-model-select"
        >
          <option value="openai">ChatGPT</option>
          <option value="qwen">通义千问</option>
        </select>
      </div>
      
      {/* 右侧：关闭按钮 */}
      <button
        onClick={() => {
          haptic.light();
          setIsFullscreen(false);
        }}
        className="mobile-icon-button"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>

  {/* 🎯 修改3: 对话内容区域 - 手机端配色和间距优化 */}
  <div
    ref={chatBoxRef}
    className="flex-1 overflow-y-auto mobile-chat-content aigc-chat-content"
    style={{
      paddingBottom: `calc(80px + env(safe-area-inset-bottom, 0px) + ${keyboardState.isOpen ? keyboardState.height : 0}px)`,
    }}
  >
    <div className="mobile-chat-container">
      {aigcLog.length === 0 && (
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[50vh] text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            开始Thinking.
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            构建你的Thinking Chain
          </p>
        </motion.div>
      )}

      <div className="mobile-messages-container">
        {aigcLog.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`${msg.role === 'user' ? 'flex justify-end' : ''}`}
          >
            {msg.role === 'user' ? (
              // 🎯 用户消息 - 手机端压缩纵向间距
              <div className="mobile-user-message">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1 justify-end">
                  <span>👤</span>
                  <span>你</span>
                </div>
                
                <div className="mobile-user-bubble">
                  <div className="mobile-user-content">
                    <ReactMarkdown
                      components={getMarkdownComponents(false)}
                      remarkPlugins={[remarkGfm]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              // 🎯 AIGC消息 - 手机端全宽+深空灰配色
              <div className="mobile-aigc-message">
                <div className="mobile-aigc-content">
                  <ReactMarkdown
                    components={getMarkdownComponents(false)}
                    remarkPlugins={[remarkGfm]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="mobile-loading-message">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">正在回复...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  </div>

  {/* 🎯 修改4: 输入区域 - 手机端配色优化 */}
  <div className="mobile-input-area">
    <div className="mobile-input-container">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              requestAnimationFrame(() => {
                adjustTextareaHeight();
              });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !loading) {
                e.preventDefault();
                handleAIGCSubmit();
              }
            }}
            placeholder="输入你的问题..."
            disabled={loading}
            rows={1}
            className="mobile-input-textarea"
            style={{ 
              minHeight: '44px',
              maxHeight: '100px',
              overflow: 'hidden',
            }}
          />
          
          <button
            type="button"
            onClick={() => {
              haptic.medium();
              handleAIGCSubmit();
            }}
            disabled={loading || !input.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center ${
              !loading && input.trim()
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 active:scale-95 shadow-lg' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* 简化底部提示 */}
      <div className="hidden sm:flex justify-center items-center mt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  </div>
</div>

/* 🎯 修改5: CSS样式 - 手机端专用样式 */
<style jsx>{`
  /* 只在手机端应用的样式 */
  @media (max-width: 767px) {
    /* 全屏容器配色 */
    .mobile-fullscreen-container {
      background: linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%);
    }
    
    .dark .mobile-fullscreen-container {
      background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
    }

    /* 顶部导航栏 - 中度压缩 */
    .mobile-topbar {
      background: rgba(250, 250, 249, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(229, 231, 235, 0.6);
      padding: 8px 16px; /* py-2 px-4 */
      padding-top: max(8px, env(safe-area-inset-top));
    }
    
    .dark .mobile-topbar {
      background: rgba(10, 10, 10, 0.95);
      border-bottom-color: rgba(55, 65, 81, 0.6);
    }

    .mobile-topbar-content {
      height: 32px; /* h-8 = 32px */
    }

    /* 图标按钮 - 完全透明 */
    .mobile-icon-button {
      width: 40px;
      height: 40px;
      background: transparent;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .mobile-icon-button:hover {
      background: rgba(107, 114, 128, 0.1);
    }
    
    .dark .mobile-icon-button:hover {
      background: rgba(156, 163, 175, 0.1);
    }

    /* 模型选择 - 透明背景 */
    .mobile-model-select {
      background: transparent;
      border: 0;
      font-size: 16px;
      font-weight: 500;
      color: #111827;
      outline: none;
      cursor: pointer;
      padding-right: 24px;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
      background-position: right center;
      background-repeat: no-repeat;
      background-size: 16px;
    }
    
    .dark .mobile-model-select {
      color: #f9fafb;
    }

    /* 聊天内容区域 */
    .mobile-chat-content {
      background: linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%);
    }
    
    .dark .mobile-chat-content {
      background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
    }

    .mobile-chat-container {
      padding: 12px 16px;
    }

    .mobile-messages-container {
      space-y: 12px; /* 减少消息间距 */
    }

    /* 用户消息 - 压缩纵向间距 */
    .mobile-user-message {
      max-width: 65%;
      min-width: 0;
    }

    .mobile-user-bubble {
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      color: #ffffff;
      border-radius: 16px;
      border-bottom-right-radius: 6px;
      padding: 8px 12px; /* 压缩 py 从 12px 到 8px */
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .mobile-user-content {
      font-size: 16px;
      line-height: 1.4; /* 压缩行高 */
      word-break: break-words;
    }

    /* AIGC消息 - 全宽+深空灰 */
    .mobile-aigc-message {
      width: 100%;
      padding: 0 12px; /* 保持呼吸感 */
    }

    .mobile-aigc-content {
      background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
      color: #f9fafb;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 16px;
      line-height: 1.5;
      word-break: break-words;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .mobile-loading-message {
      padding: 8px 12px;
    }

    /* 输入区域 */
    .mobile-input-area {
      background: rgba(250, 250, 249, 0.95);
      backdrop-filter: blur(12px);
      border-top: 1px solid rgba(229, 231, 235, 0.6);
      padding: 12px 16px;
      padding-bottom: max(12px, env(safe-area-inset-bottom));
    }
    
    .dark .mobile-input-area {
      background: rgba(10, 10, 10, 0.95);
      border-top-color: rgba(55, 65, 81, 0.6);
    }

    .mobile-input-container {
      max-width: none;
    }

    .mobile-input-textarea {
      width: 100%;
      resize: none;
      border: 1px solid #d1d5db;
      border-radius: 24px;
      background: #ffffff;
      color: #111827;
      padding: 12px 56px 12px 16px;
      font-size: 16px;
      transition: all 0.2s ease;
    }
    
    .mobile-input-textarea:focus {
      outline: none;
      border-color: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }
    
    .dark .mobile-input-textarea {
      border-color: #4b5563;
      background: #1f2937;
      color: #f9fafb;
    }
    
    .dark .mobile-input-textarea::placeholder {
      color: #9ca3af;
    }
  }

  /* 保持电脑和平板端的原有样式不变 */
  @media (min-width: 768px) {
    .mobile-fullscreen-container {
      background: white;
    }
    
    .dark .mobile-fullscreen-container {
      background: #111827;
    }
    
    /* 其他电脑端样式保持不变... */
  }
`}</style>