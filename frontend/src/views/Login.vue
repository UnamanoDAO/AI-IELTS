<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>{{ isLogin ? '登录' : '注册' }}</h1>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="username"
            type="text"
            placeholder="请输入用户名（3-50个字符）"
            required
            minlength="3"
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码（至少6个字符）"
            required
            minlength="6"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '处理中...' : isLogin ? '登录' : '注册' }}
        </button>
      </form>

      <div class="toggle-mode">
        <span v-if="isLogin">
          还没有账号？
          <a @click="toggleMode">立即注册</a>
        </span>
        <span v-else>
          已有账号？
          <a @click="toggleMode">立即登录</a>
        </span>
      </div>

      <div class="back-home">
        <a @click="goHome">返回主菜单</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import api from '@/api';

const router = useRouter();
const userStore = useUserStore();

const isLogin = ref(true);
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

function toggleMode() {
  isLogin.value = !isLogin.value;
  error.value = '';
}

async function handleSubmit() {
  error.value = '';
  loading.value = true;

  try {
    if (isLogin.value) {
      await userStore.login(username.value, password.value);
      router.push('/vocabulary-book');
    } else {
      await userStore.register(username.value, password.value);
      router.push('/vocabulary-book');
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message || '操作失败，请重试';
  } finally {
    loading.value = false;
  }
}

function goHome() {
  router.push('/vocabulary-book');
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #EDB01D;
}

.auth-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h1 {
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 30px;
  font-size: 28px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #EDB01D;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 14px;
  text-align: center;
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: #21232A;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.05) 2px,
    rgba(255, 255, 255, 0.05) 4px
  );
  pointer-events: none;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(33, 35, 42, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-mode {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.toggle-mode a {
  color: #21232A;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.toggle-mode a:hover {
  text-decoration: underline;
}

.back-home {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}

.back-home a {
  color: #999;
  cursor: pointer;
  text-decoration: none;
}

.back-home a:hover {
  color: #21232A;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .auth-card {
    padding: 30px 20px;
  }

  h1 {
    font-size: 24px;
  }

  .form-group input {
    font-size: 14px;
  }
}
</style>
