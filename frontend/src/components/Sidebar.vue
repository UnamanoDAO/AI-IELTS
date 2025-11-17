<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <img src="/logo.png" alt="QuackQuack" class="logo-image" />
      <h1 class="logo-text">QuackQuack</h1>
    </div>

    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <component :is="iconMap[item.icon]" :size="20" class="nav-icon" />
        <span class="nav-text">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="user-card">
      <div class="user-avatar">{{ userInitial }}</div>
      <div class="user-info">
        <div class="user-name">{{ username }}</div>
        <div class="user-stats">{{ totalWords }} 个单词</div>
      </div>
      <button @click="handleLogout" class="btn-logout" title="退出登录">
        <DoorOpen :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useProgressStore } from '@/stores/progress';
import { BookMarked, Target, BookOpen, DoorOpen, BookText } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const progressStore = useProgressStore();

const menuItems = [
  { path: '/vocabulary-book', icon: 'book', label: '我的单词本' },
  { path: '/reading-comprehension', icon: 'reading', label: '阅读理解' },
  { path: '/vocabulary-test', icon: 'target', label: '连线测试' },
  { path: '/units', icon: 'library', label: '课程单元' }
];

const iconMap = {
  book: BookOpen,
  reading: BookText,
  target: Target,
  library: BookMarked
};

const username = computed(() => userStore.username || '未登录');
const userInitial = computed(() => username.value.charAt(0).toUpperCase());

const totalWords = computed(() => {
  const allUnits = progressStore.units;
  return Object.values(allUnits).reduce((sum, unit) => sum + unit.learnedWords.length, 0);
});

function isActive(path) {
  return route.path.startsWith(path);
}

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout();
    router.push('/login');
  }
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #EDB01D;
  margin: 0;
}

.nav-menu {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  color: #666;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  cursor: pointer;
}

.nav-item:hover {
  background: #F5EDE4;
  color: #EDB01D;
}

.nav-item.active {
  background: rgba(237, 176, 29, 0.08);
  color: #21232A;
  border-left-color: #EDB01D;
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
}

.nav-text {
  font-size: 15px;
}

.user-card {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #F5EDE4;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #EDB01D;
  color: #21232A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-stats {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.btn-logout {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-logout:hover {
  background: #21232A;
  color: white;
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 200;
    border-right: none;
    border-bottom: 2px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .sidebar-header {
    padding: 12px 16px;
  }

  .logo-image {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    font-size: 16px;
  }

  .nav-menu {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
  }

  .nav-menu::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }

  .nav-item {
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    flex: 0 0 auto;
    min-width: 70px;
    text-align: center;
    border-left: none;
    border-bottom: 3px solid transparent;
  }

  .nav-item.active {
    border-left-color: transparent;
    border-bottom-color: #EDB01D;
  }

  .nav-icon {
    font-size: 20px;
  }

  .nav-text {
    font-size: 11px;
  }

  .user-card {
    display: none; /* 移动端隐藏用户卡片，改用头像按钮 */
  }

  /* 移动端添加退出按钮到header */
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

/* 超小屏幕 */
@media (max-width: 375px) {
  .nav-item {
    min-width: 60px;
    padding: 8px 10px;
  }

  .nav-icon {
    font-size: 18px;
  }

  .nav-text {
    font-size: 10px;
  }
}
</style>
