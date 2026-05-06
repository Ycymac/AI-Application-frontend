import axios from 'axios';
import { Message } from 'element-ui';
import store from '@/store';

export const AUTH_EXPIRED_MESSAGE = '登录状态已失效，请重新登录';

const AUTH_FAILURE_PATTERNS = [
  /jwt(?:.*(?:expired|invalid|error|exception|failed|failure|校验|异常|失败|错误|不通过|失效|过期|无效))?/i,
  /bearer/i,
  /unauthorized/i,
  /未登录/i,
  /登录(?:状态)?已?(?:失效|过期)/i,
  /认证(?:失败|异常|错误)/i,
  /鉴权(?:失败|异常|错误)/i,
  /(?:token|令牌).*(?:校验|失效|过期|无效|非法|异常|错误|失败|expired|invalid|error|failed)/i,
  /签名.*(?:无效|错误|失败)/i
];

let authRedirecting = false;

function resolveOrigin(port) {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `${protocol}//${hostname}:${port}`;
}

function extractErrorMessage(payload) {
  if (!payload) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  return payload.message || payload.msg || payload.error || '';
}

function isIgnoredAuthRoute(config = {}) {
  const url = String(config.url || '');
  return /\/api\/user\/service\/(login|sign\/up)\b/i.test(url);
}

function matchesAuthFailure(message = '') {
  return AUTH_FAILURE_PATTERNS.some(pattern => pattern.test(message));
}

function shouldHandleAuthFailure({ status, code, message }) {
  const normalizedCode = code === undefined || code === null ? '' : String(code);

  if (status === 401 || normalizedCode === '401') {
    return true;
  }

  if (matchesAuthFailure(message)) {
    return true;
  }

  return status === 403 && matchesAuthFailure(message);
}

function redirectToAuth(message = AUTH_EXPIRED_MESSAGE) {
  store.commit('clearAuth');

  if (typeof window === 'undefined' || authRedirecting) {
    return;
  }

  authRedirecting = true;
  Message.warning(message);

  if (window.location.hash !== '#/auth') {
    window.location.hash = '#/auth';
  }

  window.setTimeout(() => {
    authRedirecting = false;
  }, 300);
}

export function handleAuthFailure({ status, code, message, config } = {}) {
  if (isIgnoredAuthRoute(config)) {
    return false;
  }

  if (!shouldHandleAuthFailure({ status, code, message })) {
    return false;
  }

  redirectToAuth(message || AUTH_EXPIRED_MESSAGE);
  return true;
}

function attachInterceptors(instance) {
  instance.interceptors.request.use(config => {
    const token = store.state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    response => {
      const payload = response.data || {};
      const code = payload.code;

      if (code !== undefined && code !== null && String(code) !== '0') {
        const message = extractErrorMessage(payload) || '请求失败';

        if (handleAuthFailure({
          status: response.status,
          code,
          message,
          config: response.config
        })) {
          return Promise.reject(new Error(AUTH_EXPIRED_MESSAGE));
        }

        return Promise.reject(new Error(message));
      }

      return payload;
    },
    error => {
      const response = error.response || {};
      const message = extractErrorMessage(response.data)
        || error.message
        || '服务异常';

      if (handleAuthFailure({
        status: response.status,
        code: response.data && response.data.code,
        message,
        config: error.config || response.config
      })) {
        return Promise.reject(new Error(AUTH_EXPIRED_MESSAGE));
      }

      return Promise.reject(new Error(message));
    }
  );

  return instance;
}

function createClient(baseURL) {
  return attachInterceptors(axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json'
    }
  }));
}

const userHttp = createClient(resolveOrigin(10020));
const agentHttp = createClient(resolveOrigin(10010));
const knowledgeHttp = createClient(resolveOrigin(10030));
const ragHttp = createClient(resolveOrigin(10040));

export {
  agentHttp,
  knowledgeHttp,
  ragHttp,
  userHttp
};

export default userHttp;
