// client/src/api/axiosInstance.js
import axios from 'axios';

// 创建axios实例
const instance = axios.create({
  baseURL: 'https://api.potacademy.net/api/',
  withCredentials: true,
});

// Token管理
let isRefreshing = false;
let refreshSubscribers = [];

// 添加到刷新等待队列
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// 通知所有等待的请求
const onRefreshed = (token) => {
  refreshSubscribers.map(callback => callback(token));
  refreshSubscribers = [];
};

// 刷新token
const refreshToken = async () => {
  try {
    const response = await axios.post('/api/auth/refresh', {}, {
      withCredentials: true // 使用httpOnly cookie中的refresh token
    });
    
    const { token } = response.data;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    // refresh token也失效了，跳转登录
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/';
    throw error;
  }
};

// 请求拦截器 - 自动携带token
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理token过期
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    // 如果是401错误且不是登录/刷新请求
    if (response?.status === 401 && 
        !config.url.includes('/auth/login') && 
        !config.url.includes('/auth/refresh')) {
      
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshToken();
          onRefreshed(newToken);
          
          // 重试原始请求
          config.headers.Authorization = `Bearer ${newToken}`;
          return instance(config);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      // 如果正在刷新token，将请求添加到队列
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          config.headers.Authorization = `Bearer ${token}`;
          resolve(instance(config));
        });
      });
    }
    
    return Promise.reject(error);
  }
);

export default instance;