<template>
  <div class="auth-page">
    <div class="auth-backdrop"></div>
    <div class="auth-orb auth-orb-left"></div>
    <div class="auth-orb auth-orb-right"></div>

    <transition name="hero-fade" mode="out-in">
      <section v-if="!showPanel" key="welcome" class="auth-hero">
        <div class="auth-hero-cta">
          <button type="button" class="enter-button" @click="showPanel = true">
            进入 JAVIS
          </button>
          <p>进入面试助手工作台，管理账号、简历与候选人资料。</p>
        </div>
      </section>

      <div v-else key="panel" class="auth-panel glass-panel">
        <div class="auth-panel-glow"></div>

        <button type="button" class="back-button" @click="showPanel = false">
          返回背景
        </button>

        <div class="auth-head">
          <span class="auth-kicker">AI Agent Interview</span>
          <h1>{{ isLoginMode ? '欢迎回来' : '创建你的面试空间' }}</h1>
          <p>{{ isLoginMode ? '登录后继续管理简历与面试资料。' : '注册账号后即可进入简历管理工作台。' }}</p>
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
              <el-form-item label="账号" prop="accountId">
                <el-input v-model.trim="form.accountId" placeholder="请输入账号或邮箱"></el-input>
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
                  placeholder="请输入密码"
                  type="password"
                  @keyup.enter.native="submit"
                />
              </el-form-item>

              <div class="auth-meta">
                <span>{{ isLoginMode ? '保持登录状态，进入工作台。' : '三项信息即可完成注册。' }}</span>
                <button class="auth-switch" type="button" @click="switchMode(!isLoginMode)">
                  {{ isLoginMode ? '去注册' : '去登录' }}
                </button>
              </div>

              <div class="auth-actions">
                <el-button class="auth-submit" type="primary" :loading="submitting" @click="submit">
                  {{ isLoginMode ? '登录' : '注册并进入' }}
                </el-button>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { login, signUp } from '@/services/api';

export default {
  name: 'AuthPage',
  data() {
    return {
      showPanel: false,
      isLoginMode: true,
      submitting: false,
      form: {
        accountId: '',
        nickName: '',
        password: ''
      }
    };
  },
  computed: {
    rules() {
      return {
        accountId: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        nickName: this.isLoginMode ? [] : [{ required: true, message: '请输入昵称', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
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
              nickName: result.data.nickName
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
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-backdrop {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(5, 15, 29, 0.22), rgba(16, 106, 125, 0.1)),
    url('../assets/progress.jpg') 68% 54% / cover no-repeat;
  transform: scale(1.005);
}

.auth-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(147, 241, 255, 0.08), transparent 20%),
    radial-gradient(circle at 78% 28%, rgba(255, 255, 255, 0.06), transparent 16%),
    rgba(10, 24, 39, 0.08);
  backdrop-filter: blur(0.8px);
}

.auth-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.75;
  animation: floatOrb 8s ease-in-out infinite;
}

.auth-orb-left {
  width: 220px;
  height: 220px;
  left: 12%;
  top: 18%;
  background: radial-gradient(circle, rgba(116, 242, 255, 0.65), rgba(116, 242, 255, 0));
}

.auth-orb-right {
  width: 260px;
  height: 260px;
  right: 9%;
  bottom: 14%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0));
  animation-delay: -3s;
}

.auth-hero,
.auth-panel {
  position: relative;
  z-index: 1;
}

.auth-hero {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 48px);
  color: #f7fdff;
  animation: heroEnter 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.auth-hero-cta {
  position: absolute;
  left: 50%;
  bottom: 7%;
  transform: translateX(-50%);
  width: min(460px, calc(100% - 32px));
  text-align: center;
}

.auth-hero p {
  width: min(420px, 100%);
  margin: 16px auto 0;
  line-height: 1.7;
  color: rgba(230, 245, 248, 0.82);
}

.enter-button {
  margin-top: 30px;
  min-width: 220px;
  height: 56px;
  padding: 0 28px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  color: #f7fdff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 18px 42px rgba(5, 18, 33, 0.22);
  transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}

.enter-button:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.18);
  box-shadow: 0 22px 54px rgba(5, 18, 33, 0.28);
}

.auth-panel {
  width: min(480px, 100%);
  padding: 34px 32px 28px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  box-shadow:
    0 28px 70px rgba(5, 18, 33, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.34);
  animation: panelEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.auth-panel-glow {
  position: absolute;
  inset: 1px;
  border-radius: 29px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02));
  pointer-events: none;
}

.back-button {
  position: relative;
  z-index: 1;
  margin-bottom: 18px;
  border: none;
  padding: 0;
  background: transparent;
  color: rgba(230, 245, 248, 0.78);
  font-size: 13px;
  cursor: pointer;
}

.auth-head {
  position: relative;
}

.auth-kicker {
  display: inline-block;
  margin-bottom: 14px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  color: #d8fbff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.auth-head h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.14;
  color: #f7fdff;
  letter-spacing: 0.01em;
}

.auth-head p {
  margin: 10px 0 0;
  color: rgba(230, 245, 248, 0.78);
}

.auth-toggle {
  position: relative;
  margin-top: 26px;
  margin-bottom: 18px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  padding: 4px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.auth-toggle-item {
  position: relative;
  z-index: 1;
  height: 42px;
  border: none;
  background: transparent;
  color: rgba(230, 245, 248, 0.72);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.28s ease;
}

.auth-toggle-item.active {
  color: #0c2232;
}

.auth-toggle-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(235, 252, 255, 0.96), rgba(204, 244, 248, 0.88));
  box-shadow: 0 10px 28px rgba(133, 229, 236, 0.22);
  transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.auth-toggle-thumb.right {
  transform: translateX(100%);
}

.auth-form-wrap {
  position: relative;
}

.auth-form /deep/ .el-form-item {
  margin-bottom: 18px;
}

.auth-form /deep/ .el-form-item__label {
  padding-bottom: 8px;
  color: rgba(233, 246, 250, 0.92);
  font-weight: 600;
}

.auth-form /deep/ .el-input__inner {
  height: 50px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: #f7fdff;
  transition: border-color 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;
}

.auth-form /deep/ .el-input__inner::placeholder {
  color: rgba(231, 244, 247, 0.45);
}

.auth-form /deep/ .el-input__inner:focus {
  border-color: rgba(144, 240, 248, 0.56);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 4px rgba(144, 240, 248, 0.12);
}

.auth-form /deep/ .el-input__suffix {
  color: rgba(255, 255, 255, 0.72);
}

.auth-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 4px;
  color: rgba(230, 245, 248, 0.7);
  font-size: 13px;
}

.auth-switch {
  border: none;
  padding: 0;
  background: transparent;
  color: #d6fbff;
  font-size: 13px;
  cursor: pointer;
}

.auth-actions {
  margin-top: 18px;
}

.auth-submit {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(90deg, #b9fbff, #7ee5ee 38%, #53c9d7 100%);
  color: #082132;
  font-weight: 700;
  box-shadow: 0 16px 30px rgba(64, 201, 215, 0.24);
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.auth-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 20px 38px rgba(64, 201, 215, 0.3);
}

.hero-fade-enter-active,
.hero-fade-leave-active,
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease;
}

.hero-fade-enter,
.hero-fade-leave-to,
.panel-fade-enter,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.field-slide-enter-active,
.field-slide-leave-active {
  transition: opacity 0.26s ease, transform 0.26s ease, max-height 0.26s ease, margin 0.26s ease;
  overflow: hidden;
}

.field-slide-enter,
.field-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  margin-bottom: 0;
}

@keyframes heroEnter {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes panelEnter {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes floatOrb {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -14px, 0);
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding: 18px;
  }

  .auth-backdrop {
    background:
      linear-gradient(135deg, rgba(5, 15, 29, 0.24), rgba(16, 106, 125, 0.1)),
      url('../assets/progress.jpg') 76% 58% / cover no-repeat;
  }

  .auth-hero {
    min-height: calc(100vh - 36px);
  }

  .auth-hero-cta {
    bottom: 8%;
    width: calc(100% - 32px);
  }

  .enter-button {
    min-width: 190px;
  }

  .auth-panel {
    padding: 28px 20px 22px;
    border-radius: 24px;
  }

  .auth-panel-glow {
    border-radius: 23px;
  }

  .auth-head h1 {
    font-size: 28px;
  }

  .auth-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
