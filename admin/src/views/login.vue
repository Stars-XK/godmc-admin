<template>
  <div class="login-wrapper">
    <!-- 水纹背景 -->
    <div class="water-bg">
      <div class="wave wave-1"></div>
      <div class="wave wave-2"></div>
      <div class="wave wave-3"></div>
    </div>

    <div class="login-container">
      <div class="login-card">
        <!-- 左侧品牌区 -->
        <div class="login-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="url(#g)"/>
              <path d="M14 28C14 22.477 18.477 18 24 18C29.523 18 34 22.477 34 28" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M18 28C18 24.686 20.686 22 24 22C27.314 22 30 24.686 30 28" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
              <circle cx="24" cy="28" r="3" fill="#fff"/>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stop-color="#14B8A6"/>
                  <stop offset="100%" stop-color="#0D9488"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 class="brand-title">智慧水务</h2>
          <p class="brand-subtitle">IoT 管理平台</p>
          <div class="brand-features">
            <span>实时监控</span>
            <span>智能报警</span>
            <span>数据分析</span>
            <span>DMA 管理</span>
          </div>
        </div>

        <!-- 右侧登录区 -->
        <div class="login-form-wrapper">
          <h3 class="form-title">欢迎登录</h3>
          <p class="form-desc">请输入您的账号信息</p>

          <el-form ref="loginRef" :model="loginForm.model" :rules="loginForm.rules" class="login-form">
            <el-form-item prop="userName">
              <el-input
                v-model.trim="loginForm.model.userName"
                size="large"
                placeholder="请输入账号"
                auto-complete="off"
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.model.password"
                size="large"
                type="password"
                placeholder="请输入密码"
                auto-complete="off"
                show-password
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="authCodeInfo.captchaEnabled" prop="code">
              <div class="captcha-row">
                <el-input
                  v-model.trim="loginForm.model.code"
                  size="large"
                  placeholder="验证码"
                  maxlength="3"
                  auto-complete="off"
                  @keyup.enter="handleLogin"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
                <div class="captcha-img" v-html="authCodeInfo.imgUrl" @click="useAuthCode.getValidateCode(loginForm.model, true)" />
              </div>
            </el-form-item>

            <div class="login-options">
              <el-checkbox v-model="loginForm.model.rememberMe">记住密码</el-checkbox>
              <el-link v-if="showRegisterUser" type="primary" href="/register">注册账号</el-link>
            </div>

            <el-form-item>
              <el-button
                :loading="authCodeInfo.loading"
                size="large"
                type="primary"
                class="login-btn"
                @click.prevent="handleLogin"
              >
                <span v-if="!authCodeInfo.loading">登 录</span>
                <span v-else>验证中...</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="login-footer">
        <span>Copyright © 2024-2026 智慧水务 IoT 管理平台</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import useUserStore from '@/store/modules/user'
import useAuthCode from '@/hooks/useAuthCode'
import { getRegisterUser } from '@/api/login'
import { User, Lock, Key } from '@element-plus/icons-vue'

const userStore = useUserStore()
const authCodeInfo = useAuthCode.authCodeInfo
const route = useRoute()
const router = useRouter()
const loginRef = ref()
const showRegisterUser = ref()

const loginForm = reactive({
  model: {
    userName: 'admin',
    password: '123456',
    rememberMe: false,
    code: '',
    uuid: ''
  },
  rules: {
    userName: [{ required: true, trigger: 'blur', message: '请输入您的账号' }],
    password: [{ required: true, trigger: 'blur', message: '请输入您的密码' }],
    code: [{ required: true, trigger: 'change', message: '请输入验证码' }]
  }
})

const redirect = ref(undefined)

watch(route, (newRoute) => {
  redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

function getRegisterUserAllow() {
  getRegisterUser().then((res) => {
    showRegisterUser.value = res.data
  })
}

function handleLogin() {
  loginRef.value.validate((valid) => {
    if (valid) {
      authCodeInfo.loading = true
      loginForm.model.uuid = authCodeInfo.uuid
      useAuthCode.setUserCookie(loginForm.model)
      userStore.login(loginForm.model).then(() => {
        router.push({ path: redirect.value || '/' })
      }).catch(() => {
        if (authCodeInfo.captchaEnabled) {
          useAuthCode.getValidateCode(loginForm.model, true)
        }
      }).finally(() => {
        authCodeInfo.loading = false
      })
    }
  })
}

useAuthCode.getValidateCode(loginForm.model, false)
getRegisterUserAllow()
loginForm.model = useAuthCode.getUserCookie(loginForm.model)
</script>

<style lang="scss" scoped>
.login-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #0F766E 100%);
}

/* 水纹波浪背景 */
.water-bg {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;

  .wave {
    position: absolute;
    bottom: 0;
    left: -50%;
    width: 200%;
    height: 100%;
    opacity: 0.06;
  }

  .wave-1 {
    background: radial-gradient(ellipse at 30% 100%, #5EEAD4 0%, transparent 60%);
    animation: waveMove 8s ease-in-out infinite;
  }
  .wave-2 {
    background: radial-gradient(ellipse at 70% 100%, #14B8A6 0%, transparent 50%);
    animation: waveMove 10s ease-in-out infinite reverse;
    opacity: 0.04;
  }
  .wave-3 {
    background: radial-gradient(ellipse at 50% 100%, #0D9488 0%, transparent 70%);
    animation: waveMove 12s ease-in-out infinite;
    opacity: 0.05;
  }
}

@keyframes waveMove {
  0%, 100% { transform: translateY(0) scaleX(1); }
  50% { transform: translateY(-30px) scaleX(1.1); }
}

/* 登录容器 */
.login-container {
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-card {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 80px rgba(13, 148, 136, 0.15);
  overflow: hidden;
  width: 820px;
  max-width: 95vw;
  backdrop-filter: blur(10px);
}

/* 左侧品牌区 */
.login-brand {
  width: 360px;
  background: linear-gradient(160deg, #0F766E 0%, #0D9488 50%, #14B8A6 100%);
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -40px;
    width: 240px; height: 240px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
}

.brand-icon {
  position: relative;
  z-index: 1;
  margin-bottom: 20px;

  svg {
    width: 64px;
    height: 64px;
  }
}

.brand-title {
  position: relative;
  z-index: 1;
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 4px 0;
  letter-spacing: 0.04em;
}

.brand-subtitle {
  position: relative;
  z-index: 1;
  font-size: 14px;
  opacity: 0.8;
  margin: 0 0 28px 0;
  letter-spacing: 0.08em;
}

.brand-features {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;

  span {
    padding: 4px 14px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    font-size: 12px;
    background: rgba(255,255,255,0.1);
  }
}

/* 右侧登录区 */
.login-form-wrapper {
  flex: 1;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 6px 0;
}

.form-desc {
  color: #94A3B8;
  font-size: 14px;
  margin: 0 0 28px 0;
}

.login-form {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px #E2E8F0 inset;
    transition: all 0.2s;

    &:hover, &.is-focus {
      box-shadow: 0 0 0 1px #0D9488 inset;
    }
  }

  :deep(.el-icon) {
    color: #94A3B8;
  }
}

.captcha-row {
  display: flex;
  gap: 12px;
  width: 100%;

  .el-input {
    flex: 1;
  }

  .captcha-img {
    width: 120px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #E2E8F0;
    transition: border-color 0.2s;

    &:hover {
      border-color: #0D9488;
    }

    :deep(img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .el-checkbox {
    :deep(.el-checkbox__label) {
      color: #64748B;
      font-size: 13px;
    }
  }
}

.login-btn {
  width: 100%;
  height: 46px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, #0D9488, #0F766E);
  border: none;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #14B8A6, #0D9488);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4);
  }
}

/* 底部 */
.login-footer {
  margin-top: 24px;
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  text-align: center;
  letter-spacing: 0.04em;
}

@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
    width: 95vw;
  }
  .login-brand {
    width: 100%;
    padding: 32px 24px;
  }
  .login-form-wrapper {
    padding: 32px 24px;
  }
}
</style>
