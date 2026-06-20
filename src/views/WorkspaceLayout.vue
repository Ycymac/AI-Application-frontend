<template>
  <div class="layout-shell">
    <aside class="sidebar">
      <div>
        <div class="sidebar-top">
          <div class="brand-mark"></div>
          <div>
            <div class="brand-eyebrow">AI Interview OS</div>
            <div class="brand-title">RAG Evaluation</div>
          </div>
        </div>

        <router-link
          v-for="item in visibleNavItems"
          :key="item.to"
          class="nav-item"
          :to="item.to"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </div>

      <div class="sidebar-bottom">
        <div class="user-card">
          <div class="user-avatar">{{ userInitial }}</div>
          <div>
            <div class="user-name">{{ user.nickName || '未登录用户' }}</div>
            <div class="user-account">{{ user.accountId || '暂无账号' }}</div>
          </div>
        </div>
        <el-button plain class="logout-btn" @click="handleLogout">退出登录</el-button>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { logout } from '@/services/api';

export default {
  name: 'WorkspaceLayout',
  data() {
    return {
      navItems: [
        { to: '/app/project-intro', label: '项目介绍', icon: '介' },
        { to: '/app/resumes', label: '简历管理', icon: '简' },
        { to: '/app/interviews', label: '模拟面试', icon: '面' },
        { to: '/app/knowledge-bases', label: '知识库管理', icon: '库', restricted: true },
        { to: '/app/intent-nodes', label: '意图识别结点管理', icon: '意', restricted: true },
        { to: '/app/knowledge-chat', label: '知识库问答', icon: '答' }
      ]
    };
  },
  computed: {
    user() {
      return this.$store.getters.userInfo;
    },
    isBasicUser() {
      return this.$store.getters.isBasicUser;
    },
    visibleNavItems() {
      return this.navItems.filter(item => !(item.restricted && this.isBasicUser));
    },
    userInitial() {
      const source = this.user.nickName || this.user.accountId || 'A';
      return source.slice(0, 1).toUpperCase();
    }
  },
  methods: {
    async handleLogout() {
      try {
        if (this.user.accountId) {
          await logout({ accountId: this.user.accountId });
        }
      } catch (error) {
        this.$message.warning(error.message || '退出接口执行失败，已清理本地状态');
      } finally {
        this.$store.commit('clearAuth');
        this.$router.replace('/auth');
      }
    }
  }
};
</script>

<style scoped>
.layout-shell { height: 100vh; overflow: hidden; display: flex; background: var(--bg-page); color: var(--text-main); }
.sidebar { width: 288px; padding: 28px 22px; display: flex; flex-direction: column; justify-content: space-between; overflow-y: auto; color: var(--nav-text); background: var(--nav-bg); border-right: 1px solid var(--line); }
.sidebar-top { display: flex; align-items: center; gap: 14px; margin-bottom: 42px; }
.brand-mark { width: 18px; height: 46px; border-radius: var(--radius-pill); background: linear-gradient(180deg, var(--accent-cyan), var(--accent-violet), var(--accent-rose)); }
.brand-eyebrow { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.16em; color: var(--nav-muted); text-transform: uppercase; }
.brand-title { margin-top: 4px; font-family: var(--font-display); font-size: 22px; font-weight: 650; letter-spacing: -0.03em; }
.nav-item { position: relative; display: flex; align-items: center; gap: 12px; padding: 13px 14px; margin-bottom: 10px; border-radius: var(--radius-lg); color: inherit; text-decoration: none; background: var(--nav-item-bg); border: 1px solid var(--nav-item-border); transition: transform var(--duration-normal) var(--ease-product), background var(--duration-normal) var(--ease-product), border-color var(--duration-normal) var(--ease-product); }
.nav-item::before { content: ''; position: absolute; left: -1px; top: 50%; width: 3px; height: 0; border-radius: var(--radius-pill); background: var(--accent-cyan); transform: translateY(-50%); transition: height var(--duration-normal) var(--ease-product); }
.nav-item:hover { transform: translateX(2px); background: var(--nav-item-hover); }
.nav-item.router-link-exact-active { background: var(--nav-item-active); border-color: var(--line-strong); }
.nav-item.router-link-exact-active::before { height: 24px; }
.nav-icon { width: 28px; height: 28px; border-radius: var(--radius-md); display: grid; place-items: center; background: var(--nav-item-hover); font-family: var(--font-mono); font-size: 12px; font-weight: 800; }
.sidebar-bottom { display: flex; flex-direction: column; gap: 16px; }
.user-card { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-lg); background: var(--nav-item-bg); border: 1px solid var(--nav-item-border); }
.user-avatar { width: 42px; height: 42px; border-radius: var(--radius-md); display: grid; place-items: center; background: linear-gradient(135deg, var(--accent-cyan), var(--accent-violet)); color: #fff; font-weight: 800; }
.user-name { font-weight: 700; }
.user-account { margin-top: 2px; font-size: 12px; color: var(--nav-muted); }
.logout-btn { width: 100%; border-radius: var(--radius-lg); border-color: var(--nav-item-border); background: transparent; color: var(--nav-text); }
.main-content { flex: 1; min-width: 0; height: 100vh; overflow-y: auto; }
@media (max-width: 900px) { .layout-shell { height: auto; overflow: visible; flex-direction: column; } .sidebar { width: 100%; gap: 16px; overflow-y: visible; } .main-content { height: auto; } }
</style>
