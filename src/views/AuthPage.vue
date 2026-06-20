<template>
  <div class="auth-page">
    <div class="auth-backdrop" aria-hidden="true"></div>
    <section class="auth-stage" aria-label="AI 面试系统登录注册">
      <div class="stage-copy">
        <p class="mono-label">JAVIS · RAG INTERVIEW</p>
        <h1>{{ isLoginMode ? '欢迎回到智能面试工作台' : '创建你的 AI 面试空间' }}</h1>
        <p>
          以邮箱形式账号进入系统，连接简历、知识库与 AI 评判流程，构建可追溯的面试训练体验。
        </p>
        <div class="stage-flow" aria-hidden="true">
          <span>Resume</span>
          <i></i>
          <span>RAG</span>
          <i></i>
          <span>Judge</span>
        </div>
      </div>

      <div class="lottie-fallback" aria-label="AI 数据流动画占位">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="core-node">AI</div>
        <span class="data-dot dot-a"></span>
        <span class="data-dot dot-b"></span>
        <span class="data-dot dot-c"></span>
      </div>
    </section>

    <section class="auth-panel product-card">
      <div class="auth-head">
        <span class="auth-kicker">Account Gateway</span>
        <h2>{{ isLoginMode ? '登录' : '注册' }}</h2>
        <p>{{ isLoginMode ? '使用邮箱格式账号继续进入工作台。' : '完成基础信息后即可使用 AI 面试与 RAG 知识库。' }}</p>
      </div>

      <div class="auth-toggle">
        <button
          type="button"
          class="auth-toggle-item"
          :class="{ active: isLoginMode }"
          @click="switchMode(true)"
        >
          登录
        </button>
        <button
          type="button"
          class="auth-toggle-item"
          :class="{ active: !isLoginMode }"
          @click="switchMode(false)"
        >
          注册
        </button>
        <span class="auth-toggle-thumb" :class="{ right: !isLoginMode }"></span>
      </div>

      <transition name="panel-fade" mode="out-in">
        <div :key="isLoginMode ? 'login' : 'register'" class="auth-form-wrap">
          <el-form ref="authForm" :model="form" :rules="rules" label-position="top" class="auth-form">
            <el-form-item label="账号 ID" prop="accountId">
              <el-input v-model.trim="form.accountId" placeholder="请输入邮箱账号，例如 user@example.com"></el-input>
            </el-form-item>

            <transition name="field-slide">
              <el-form-item v-if="!isLoginMode" label="昵称" prop="nickName">
                <el-input v-model.trim="form.nickName" placeholder="请输入显示昵称"></el-input>
              </el-form-item>
            </transition>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model.trim="form.password"
                show-password
                placeholder="请输入 6-20 位密码"
                type="password"
                @keyup.enter.native="submit"
              />
            </el-form-item>

            <transition name="field-slide">
              <el-form-item v-if="!isLoginMode" label="确认密码" prop="confirmPassword">
                <el-input
                  v-model.trim="form.confirmPassword"
                  show-password
                  placeholder="请再次输入密码"
                  type="password"
                  @keyup.enter.native="submit"
                />
              </el-form-item>
            </transition>

            <div class="auth-meta">
              <span>{{ isLoginMode ? '账号 ID 必须为邮箱格式。' : '注册时会校验两次密码是否一致。' }}</span>
              <button class="auth-switch" type="button" @click="switchMode(!isLoginMode)">
                {{ isLoginMode ? '去注册' : '去登录' }}
              </button>
            </div>

            <div class="auth-actions">
              <el-button class="auth-submit" type="primary" :loading="submitting" @click="submit">
                {{ isLoginMode ? '登录工作台' : '创建账号' }}
              </el-button>
            </div>
          </el-form>
        </div>
      </transition>
    </section>
  </div>
</template>

<script>
import { login, signUp } from '@/services/api';

export default {
  name: 'AuthPage',
  data() {
    return {
      isLoginMode: true,
      submitting: false,
      form: {
        accountId: '',
        nickName: '',
        password: '',
        confirmPassword: ''
      }
    };
  },
  computed: {
    rules() {
      const validateConfirmPassword = (rule, value, callback) => {
        if (rule.field === 'confirmPassword' && this.isLoginMode) {
          callback();
          return;
        }
        if (!value) {
          callback(new Error('请确认密码'));
          return;
        }
        if (value !== this.form.password) {
          callback(new Error('两次输入的密码不一致'));
          return;
        }
        callback();
      };

      return {
        accountId: [
          { required: true, message: '请输入账号 ID', trigger: 'blur' },
          { type: 'email', message: '账号 ID 需为邮箱格式，例如 xxx@example.com', trigger: ['blur', 'change'] }
        ],
        nickName: this.isLoginMode ? [] : [{ required: true, message: '请输入昵称', trigger: 'blur' }],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度为 6-20 位', trigger: ['blur', 'change'] }
        ],
        confirmPassword: this.isLoginMode ? [] : [{ validator: validateConfirmPassword, trigger: ['blur', 'change'] }]
      };
    }
  },
  methods: {
    switchMode(isLoginMode) {
      if (this.isLoginMode === isLoginMode) {
        return;
      }
      this.isLoginMode = isLoginMode;
      this.form.password = '';
      this.form.confirmPassword = '';
      this.$nextTick(() => {
        if (this.$refs.authForm) {
          this.$refs.authForm.clearValidate();
        }
      });
    },
    submit() {
      this.$refs.authForm.validate(async valid => {
        if (!valid) {
          return;
        }

        this.submitting = true;
        try {
          if (this.isLoginMode) {
            const result = await login({
              accountId: this.form.accountId,
              password: this.form.password
            });
            this.$store.commit('setAuth', {
              token: result.token,
              accountId: result.data.accountId,
              nickName: result.data.nickName,
              permission: result.data.permission ?? result.permission
            });
            this.$message.success('登录成功');
            this.$router.replace('/app/resumes');
          } else {
            await signUp({
              accountId: this.form.accountId,
              password: this.form.password,
              nickName: this.form.nickName
            });
            this.$message.success('注册成功，请登录');
            this.switchMode(true);
          }
        } catch (error) {
          this.$message.error(error.message || '操作失败');
        } finally {
          this.submitting = false;
        }
      });
    }
  }
};
</script>

<style scoped>
.auth-page {
  position: relative;
  height: 100vh;
  padding: clamp(20px, 4vw, 44px);
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(360px, 480px);
  gap: clamp(24px, 5vw, 64px);
  align-items: center;
  overflow: hidden;
  color: var(--text-main);
  background:
    radial-gradient(circle at 10% 12%, var(--accent-cyan-soft), transparent 26%),
    radial-gradient(circle at 84% 82%, var(--accent-violet-soft), transparent 24%);
}

.auth-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: url('../assets/progress.jpg') center / cover no-repeat;
  opacity: 0.22;
}

/* In light mode the original (dark) image is inverted for legibility */
html[data-theme="light"] .auth-backdrop {
  filter: invert(1) hue-rotate(180deg);
  opacity: 0.16;
}

.auth-stage,
.auth-panel {
  position: relative;
  z-index: 1;
}

.auth-stage {
  min-height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 42px;
}

.stage-copy h1 {
  max-width: 820px;
  margin: 16px 0;
  font-family: var(--font-display);
  font-size: clamp(44px, 7.4vw, 92px);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.stage-copy p {
  max-width: 660px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 17px;
  line-height: 1.9;
}

.stage-flow {
  margin-top: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stage-flow span {
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
}

.stage-flow i {
  width: 34px;
  height: 1px;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-violet));
}

.lottie-fallback {
  position: relative;
  width: min(420px, 80vw);
  aspect-ratio: 1;
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
  background: var(--surface-card);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.lottie-fallback::before {
  content: '';
  position: absolute;
  inset: 32px;
  border-radius: var(--radius-lg);
  background:
    linear-gradient(90deg, transparent 0 48%, var(--line) 48% 52%, transparent 52% 100%),
    linear-gradient(0deg, transparent 0 48%, var(--line) 48% 52%, transparent 52% 100%);
  background-size: 42px 42px;
  opacity: 0.75;
}

.orbit {
  position: absolute;
  inset: 70px;
  border: 1px solid var(--accent-cyan);
  border-radius: var(--radius-pill);
  animation: rotateOrbit 12s linear infinite;
}

.orbit-two {
  inset: 104px;
  border-color: var(--accent-violet);
  animation-duration: 9s;
  animation-direction: reverse;
}

.core-node {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 92px;
  height: 92px;
  border-radius: var(--radius-xl);
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%);
  color: var(--bg-page);
  background: var(--text-main);
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 900;
}

.data-dot {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-pill);
  animation: floatDot 4s var(--ease-product) infinite;
}

.dot-a { left: 18%; top: 22%; background: var(--accent-cyan); }
.dot-b { right: 22%; top: 28%; background: var(--accent-violet); animation-delay: -1.2s; }
.dot-c { right: 28%; bottom: 22%; background: var(--accent-lime); animation-delay: -2.2s; }

.auth-panel {
  padding: 30px;
  border-radius: var(--radius-xl);
  animation: panelEnter var(--duration-panel) var(--ease-product) both;
}

.auth-kicker {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--accent-violet);
  background: var(--accent-violet-soft);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.auth-head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 34px;
  letter-spacing: -0.04em;
}

.auth-head p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.auth-toggle {
  position: relative;
  margin: 26px 0 18px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  padding: 4px;
  border-radius: var(--radius-lg);
  background: var(--surface-muted);
  border: 1px solid var(--line);
}

.auth-toggle-item {
  position: relative;
  z-index: 1;
  height: 42px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
  transition: color var(--duration-normal) var(--ease-product);
}

.auth-toggle-item.active {
  color: var(--bg-page);
}

.auth-toggle-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  border-radius: var(--radius-md);
  background: var(--text-main);
  transition: transform var(--duration-normal) var(--ease-product);
}

.auth-toggle-thumb.right {
  transform: translateX(100%);
}

.auth-form /deep/ .el-form-item {
  margin-bottom: 18px;
}

.auth-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 13px;
}

.auth-switch {
  border: none;
  padding: 0;
  background: transparent;
  color: var(--accent-cyan);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.auth-actions {
  margin-top: 18px;
}

.auth-submit {
  width: 100%;
  height: 52px;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-product), transform var(--duration-normal) var(--ease-product);
}

.panel-fade-enter,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.field-slide-enter-active,
.field-slide-leave-active {
  transition: opacity var(--duration-normal) var(--ease-product), transform var(--duration-normal) var(--ease-product), max-height var(--duration-normal) var(--ease-product), margin var(--duration-normal) var(--ease-product);
  overflow: hidden;
}

.field-slide-enter,
.field-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  margin-bottom: 0;
}

@keyframes panelEnter {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes rotateOrbit {
  from { transform: rotate(0deg) scale(1); }
  to { transform: rotate(360deg) scale(1); }
}

@keyframes floatDot {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@media (max-width: 980px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-stage {
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding: 18px;
  }

  .stage-flow,
  .auth-meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .stage-flow i {
    display: none;
  }

  .auth-panel {
    padding: 22px;
  }
}
</style>
