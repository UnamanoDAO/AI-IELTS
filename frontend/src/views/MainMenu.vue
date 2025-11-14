<template>
  <div class="menu-container">
    <div class="header">
      <h1 class="app-title">LeanEnglish</h1>
      <p class="subtitle">IELTS 英语学习平台</p>
    </div>

    <div class="menu-grid">
      <div class="menu-card" @click="navigateTo('/units')">
        <div class="card-icon"><BookMarked :size="60" /></div>
        <h2>学单词</h2>
        <p>系统化学习IELTS词汇</p>
      </div>

      <div class="menu-card" @click="navigateTo('/vocabulary-book')">
        <div class="card-icon"><BookOpen :size="60" /></div>
        <h2>错题本</h2>
        <p>收集和复习难点单词</p>
      </div>
    </div>

    <div class="user-section">
      <div v-if="user" class="user-info">
        <span>欢迎, {{ user.username }}</span>
        <button @click="logout" class="btn-logout">退出登录</button>
      </div>
      <div v-else class="user-info">
        <button @click="navigateTo('/login')" class="btn-login">登录 / 注册</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { BookMarked, BookOpen } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const user = ref(null);

onMounted(() => {
  user.value = userStore.currentUser;
});

function navigateTo(path) {
  router.push(path);
}

function logout() {
  userStore.logout();
  user.value = null;
}
</script>

<style scoped>
.menu-container {
  min-height: 100vh;
  padding: 20px;
  background: #EDB01D;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.header {
  text-align: center;
  color: #21232A;
  margin-bottom: 40px;
}

.app-title {
  font-size: 48px;
  font-weight: bold;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 18px;
  margin-top: 10px;
  opacity: 0.9;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 600px;
  margin-bottom: 40px;
}

.menu-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.menu-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.card-icon {
  color: #21232A;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-card h2 {
  font-size: 24px;
  color: #333;
  margin: 10px 0;
}

.menu-card p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.user-section {
  margin-top: 20px;
}

.user-info {
  color: white;
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 30px;
  backdrop-filter: blur(10px);
}

.btn-login,
.btn-logout {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-login {
  background: white;
  color: #21232A;
  font-weight: bold;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.btn-login:hover,
.btn-logout:hover {
  transform: scale(1.05);
}

/* Mobile optimization */
@media (max-width: 768px) {
  .app-title {
    font-size: 36px;
  }

  .subtitle {
    font-size: 16px;
  }

  .menu-grid {
    grid-template-columns: 1fr;
    max-width: 100%;
  }

  .menu-card {
    padding: 25px;
  }

  .card-icon {
    font-size: 50px;
  }

  .menu-card h2 {
    font-size: 20px;
  }
}
</style>
