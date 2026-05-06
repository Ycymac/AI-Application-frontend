<template>
  <div class="layout-shell">
    <aside class="sidebar">
      <div>
        <div class="sidebar-top">
          <div class="brand-mark"></div>
          <div>
            <div class="brand-eyebrow">AI Interview Workspace</div>
            <div class="brand-title">Resume Console</div>
          </div>
        </div>

        <router-link class="nav-item" to="/app/resumes">
          <span class="nav-icon">简</span>
          <span>简历管理</span>
        </router-link>

        <router-link class="nav-item" to="/app/interviews">
          <span class="nav-icon">面</span>
          <span>模拟面试</span>
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
  name: 'MainLayout',
  computed: {
    user() {
      return this.$store.getters.userInfo;
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
.layout-shell {
  min-height: 100vh;
  display: flex;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 197, 0.12), transparent 30%),
    linear-gradient(180deg, #edf4fa 0%, #f7f9fc 42%, #eff5fb 100%);
}

.sidebar {
  width: 264px;
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #eefbff;
  background: linear-gradient(180deg, #082132 0%, #0d3348 100%);
  box-shadow: 12px 0 36px rgba(4, 18, 31, 0.12);
}

.sidebar-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 42px;
}

.brand-mark {
  width: 18px;
  height: 46px;
  border-radius: 999px;
  background: linear-gradient(180deg, #14b8c5, #76e2e8);
}

.brand-eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(238, 251, 255, 0.62);
  text-transform: uppercase;
}

.brand-title {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 18px;
  color: inherit;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-item.router-link-exact-active {
  background: rgba(20, 184, 197, 0.18);
  border-color: rgba(118, 226, 232, 0.3);
}

.nav-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #14b8c5, #1e90aa);
  font-weight: 700;
}

.user-name {
  font-weight: 700;
}

.user-account {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(238, 251, 255, 0.64);
}

.logout-btn {
  width: 100%;
  border-radius: 16px;
  border-color: rgba(255, 255, 255, 0.16);
  background: transparent;
  color: #eefbff;
}

.main-content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 900px) {
  .layout-shell {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    gap: 16px;
  }
}
</style>
