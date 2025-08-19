// client/src/contexts/ThemeContext.jsx - 主题管理系统

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('auto');
  const [actualTheme, setActualTheme] = useState('light');

  // 获取系统主题偏好
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // 应用主题到DOM
  const applyTheme = (themeToApply) => {
    const root = document.documentElement;
    
    if (themeToApply === 'dark') {
      root.classList.add('dark');
      setActualTheme('dark');
    } else {
      root.classList.remove('dark');
      setActualTheme('light');
    }
    
    console.log(`Theme applied: ${themeToApply}`); // 调试日志
  };

  // 更新主题
  const updateTheme = (newTheme) => {
    console.log(`Updating theme from ${theme} to ${newTheme}`); // 调试日志
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    let themeToApply;
    if (newTheme === 'auto') {
      themeToApply = getSystemTheme();
    } else {
      themeToApply = newTheme;
    }
    
    applyTheme(themeToApply);
  };

  // 初始化主题
  useEffect(() => {
    // 1. 首先检查 localStorage
    const savedTheme = localStorage.getItem('theme') || 'auto';
    
    console.log(`Initializing theme: ${savedTheme}`); // 调试日志
    
    setTheme(savedTheme);
    let themeToApply;
    if (savedTheme === 'auto') {
      themeToApply = getSystemTheme();
    } else {
      themeToApply = savedTheme;
    }
    applyTheme(themeToApply);

    // 2. 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      console.log(`System theme changed: ${e.matches ? 'dark' : 'light'}`); // 调试日志
      if (savedTheme === 'auto') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // 同步用户偏好设置（当用户登录时调用）
  const syncUserTheme = (userTheme) => {
    if (userTheme && ['light', 'dark', 'auto'].includes(userTheme)) {
      console.log(`Syncing user theme: ${userTheme}`); // 调试日志
      updateTheme(userTheme);
    }
  };

  const value = {
    theme,
    actualTheme,
    setTheme: updateTheme,
    syncUserTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};