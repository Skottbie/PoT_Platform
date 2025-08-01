import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';

// === 暗色模式自动检测逻辑 ===
function applyDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 初次加载
applyDarkMode()

// 监听系统主题切换
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyDarkMode)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <>
      <App />
      <Toaster position="top-center" />
    </>
    
  </React.StrictMode>,

);
