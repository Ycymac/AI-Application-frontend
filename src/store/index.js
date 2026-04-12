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
        nickName: ''
      };
    }
    return JSON.parse(raw);
  } catch (error) {
    return {
      token: '',
      accountId: '',
      nickName: ''
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
    }
  },
  mutations: {
    setAuth(state, payload) {
      state.auth = {
        token: payload.token || '',
        accountId: payload.accountId || '',
        nickName: payload.nickName || ''
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.auth));
    },
    clearAuth(state) {
      state.auth = {
        token: '',
        accountId: '',
        nickName: ''
      };
      localStorage.removeItem(STORAGE_KEY);
    }
  }
});
