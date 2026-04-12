import axios from 'axios';
import store from '@/store';

const http = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

http.interceptors.request.use(config => {
  const token = store.state.auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  response => {
    const payload = response.data || {};
    if (payload.code && payload.code !== '0') {
      return Promise.reject(new Error(payload.message || '请求失败'));
    }
    return payload;
  },
  error => {
    const message = error.response && error.response.data
      ? error.response.data.message || '服务异常'
      : error.message || '网络异常';
    return Promise.reject(new Error(message));
  }
);

export default http;
