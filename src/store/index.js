import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const STORAGE_KEY = 'ai-interview-auth';

function getInitialAuthState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        token: '',
        accountId: '',
        nickName: '',
        permission: 0
      };
    }
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || '',
      accountId: parsed.accountId || '',
      nickName: parsed.nickName || '',
      permission: Number(parsed.permission) || 0
    };
  } catch (error) {
    return {
      token: '',
      accountId: '',
      nickName: '',
      permission: 0
    };
  }
}

export default new Vuex.Store({
  state: {
    auth: getInitialAuthState()
  },
  getters: {
    isAuthenticated(state) {
      return Boolean(state.auth && state.auth.token);
    },
    userInfo(state) {
      return state.auth || {};
    },
    isBasicUser(state) {
      return Number(state.auth && state.auth.permission) === 1;
    }
  },
  mutations: {
    setAuth(state, payload) {
      state.auth = {
        token: payload.token || '',
        accountId: payload.accountId || '',
        nickName: payload.nickName || '',
        permission: Number(payload.permission) || 0
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.auth));
    },
    clearAuth(state) {
      state.auth = {
        token: '',
        accountId: '',
        nickName: '',
        permission: 0
      };
      localStorage.removeItem(STORAGE_KEY);
    }
  }
});
