<template>
  <div id="app">
    <router-view />
    <button
      type="button"
      class="theme-toggle"
      :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
      :title="isDark ? '浅色模式' : '深色模式'"
      @click="toggleTheme"
    >
      <span class="theme-toggle-icon">{{ isDark ? '☀︎' : '☾' }}</span>
    </button>
  </div>
</template>

<script>
const THEME_STORAGE_KEY = 'ai-interview-theme-mode';

export default {
  name: 'AppRoot',
  data() {
    return {
      theme: 'light'
    };
  },
  computed: {
    isDark() {
      return this.theme === 'dark';
    }
  },
  mounted() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      this.theme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.theme = 'dark';
    }
    this.applyTheme();
  },
  methods: {
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_STORAGE_KEY, this.theme);
      this.applyTheme();
    },
    applyTheme() {
      document.documentElement.dataset.theme = this.theme;
    }
  }
};
</script>

<style>
html,
body,
#app {
  min-height: 100%;
  margin: 0;
}

body {
  font-family: var(--font-body, "PingFang SC", "Microsoft YaHei", sans-serif);
  background: var(--bg-page, #f3f3f4);
  color: var(--text-main, #131316);
}

* {
  box-sizing: border-box;
}

button,
input,
textarea,
select {
  font: inherit;
}

.theme-toggle {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 3000;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  color: var(--text-main);
  background: var(--surface-card);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: transform var(--duration-normal) var(--ease-product), border-color var(--duration-normal) var(--ease-product), background var(--duration-normal) var(--ease-product);
}

.theme-toggle:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
}

.theme-toggle:active {
  transform: translateY(0);
}

.theme-toggle-icon {
  font-size: 18px;
  line-height: 1;
}

@media (max-width: 640px) {
  .theme-toggle {
    right: 16px;
    bottom: 16px;
  }
}
</style>
