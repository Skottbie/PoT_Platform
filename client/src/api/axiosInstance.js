// client/src/api/axiosInstance.js - 完整修复版本
import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.potacademy.net/api/',
  withCredentials: true,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('tokenExpiresAt');
  
  if (!window.location.pathname.includes('/login') && 
      !window.location.pathname === '/') {
    window.location.href = '/';
  }
};

const refreshAccessToken = async () => {
  try {
    const response = await axios.post('/auth/refresh', {}, {
      baseURL: instance.defaults.baseURL,
      withCredentials: true,
      timeout: 8000,
    });
    
    const { token, expiresIn = 7200 } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiresAt', (Date.now() + expiresIn * 1000).toString());
    
    return token;
  } catch (error) {
    console.error('Token刷新失败:', error);
    clearAuthAndRedirect();
    throw error;
  }
};

const shouldRefreshToken = () => {
  const expiresAt = localStorage.getItem('tokenExpiresAt');
  if (!expiresAt) return false;
  
  const now = Date.now();
  const expireTime = parseInt(expiresAt);
  const fiveMinutes = 5 * 60 * 1000;
  
  return (expireTime - now) < fiveMinutes;
};

// 🎯 扩展需要立即失败的端点列表
const IMMEDIATE_FAIL_ENDPOINTS = [
  '/user/profile',              // ProtectedLayout认证检查
  '/auth/check',               // 通用认证检查
  '/task/',                    // 任务相关API (包含/task/123, /task/123/submissions等)
  '/submission/',              // 提交相关API
  '/class/',                   // 班级相关API
  '/download/',               // 下载相关API
];

// 🎯 检查是否需要立即失败 - 更宽松的匹配
const shouldFailImmediately = (url) => {
  if (!url) return false;
  
  // 对于GET请求的数据获取类API，都应该立即失败
  return IMMEDIATE_FAIL_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// 请求拦截器
instance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // 主动刷新即将过期的token（但不阻塞关键认证请求）
      if (shouldRefreshToken() && !isRefreshing && !shouldFailImmediately(config.url)) {
        try {
          isRefreshing = true;
          const newToken = await refreshAccessToken();
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          // 刷新失败，继续使用原token
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && 
        !originalRequest.url.includes('/auth/refresh') &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest._retry) {
      
      // 🎯 对于数据获取类请求，立即失败
      if (shouldFailImmediately(originalRequest.url)) {
        console.log('🚨 数据获取请求认证失败，立即清理并跳转:', originalRequest.url);
        clearAuthAndRedirect();
        return Promise.reject(error);
      }
      
      // 对于其他请求，尝试刷新token
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;