import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://pot-platform.onrender.com/api',
  withCredentials: true,
});

// 自动携带 token
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
