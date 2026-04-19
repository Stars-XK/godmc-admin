<template>
  <div class="login-container">
    <div class="login-overlay"></div>
    
    <div class="login-content">
      <div class="login-brand">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
        </div>
        <h2 class="brand-name">GodMC Admin</h2>
        <p class="brand-desc">Enterprise Microservice Management Platform</p>
      </div>

      <el-form ref="loginRef" :model="loginForm.model" :rules="loginForm.rules" class="login-form">
        <div class="form-header">
          <h3>Welcome Back</h3>
          <p>Please enter your details to sign in.</p>
        </div>

        <el-form-item prop="userName">
          <el-input v-model.trim="loginForm.model.userName" maxlength="10" type="text" size="large" auto-complete="off" placeholder="Username">
            <template #prefix>
              <User class="input-icon" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.model.password" maxlength="20" type="password" size="large" auto-complete="off" placeholder="Password" @keyup.enter="handleLogin" show-password>
            <template #prefix>
              <Lock class="input-icon" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="code" v-if="authCodeInfo.captchaEnabled">
          <div class="captcha-wrapper">
            <el-input v-model.trim="loginForm.model.code" maxlength="3" size="large" auto-complete="off" placeholder="Captcha" @keyup.enter="handleLogin">
              <template #prefix>
                <svg-icon icon-class="validCode" class="input-icon" />
              </template>
            </el-input>
            <div class="login-code" v-html="authCodeInfo.imgUrl" @click="useAuthCode.getValidateCode(loginForm.model, true)" />
          </div>
        </el-form-item>

        <div class="login-actions">
          <el-checkbox v-model="loginForm.model.rememberMe">Remember me</el-checkbox>
          <el-link v-if="showRegisterUser" class="register-link" type="primary" :underline="false" href="/register" target="_blank">Create an account</el-link>
        </div>

        <el-form-item style="margin-bottom: 0;">
          <el-button :loading="authCodeInfo.loading" size="large" type="primary" class="submit-btn" @click.prevent="handleLogin">
            <span v-if="!authCodeInfo.loading">Sign In</span>
            <span v-else>Signing in...</span>
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="login-footer">
      <span>Copyright © 2024 GodMC Admin. All Rights Reserved.</span>
    </div>
  </div>
</template>

<script setup>
import useUserStore from '@/store/modules/user'
import useAuthCode from '@/hooks/useAuthCode'
import { getRegisterUser } from '@/api/login'

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

watch(
  route,
  (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect
  },
  { immediate: true }
)

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

      userStore
        .login(loginForm.model)
        .then(() => {
          router.push({ path: redirect.value || '/' })
        })
        .catch(() => {
          if (authCodeInfo.captchaEnabled) {
            useAuthCode.getValidateCode(loginForm.model, true)
          }
        })
        .finally(() => {
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
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  background: #F8FAFC;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.login-overlay {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.1) 0%, rgba(248, 250, 252, 0) 50%);
  animation: rotate 30s linear infinite;
  z-index: 0;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 0 20px;
}

.login-brand {
  text-align: center;
  margin-bottom: 40px;
  animation: fade-in-up 0.6s ease-out;

  .brand-logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    
    svg {
      width: 32px;
      height: 32px;
      color: white;
    }
  }

  .brand-name {
    font-size: 28px;
    font-weight: 700;
    color: #0F172A;
    margin: 0 0 8px;
    letter-spacing: -0.5px;
  }

  .brand-desc {
    font-size: 15px;
    color: #64748B;
    margin: 0;
  }
}

.login-form {
  width: 100%;
  background: #ffffff;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: fade-in-up 0.8s ease-out;

  .form-header {
    margin-bottom: 30px;
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 6px;
    }
    
    p {
      font-size: 14px;
      color: #94A3B8;
      margin: 0;
    }
  }
}

:deep(.el-input__wrapper) {
  padding: 8px 15px;
  background-color: #F8FAFC !important;
  box-shadow: 0 0 0 1px #E2E8F0 inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  background-color: #FFFFFF !important;
  box-shadow: 0 0 0 2px #4F46E5 inset !important;
}

.input-icon {
  width: 18px;
  height: 18px;
  color: #94A3B8;
}

.captcha-wrapper {
  display: flex;
  gap: 16px;
  
  .el-input {
    flex: 1;
  }
  
  .login-code {
    width: 120px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 0 0 1px #E2E8F0 inset;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
}

.login-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  :deep(.el-checkbox__label) {
    color: #64748B;
  }
  
  .register-link {
    font-size: 14px;
    font-weight: 500;
  }
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 12px !important;
  letter-spacing: 0.5px;
}

.login-footer {
  position: absolute;
  bottom: 24px;
  text-align: center;
  color: #94A3B8;
  font-size: 13px;
  animation: fade-in 1s ease-out 0.5s both;
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
</style>
