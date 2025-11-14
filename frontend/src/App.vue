<template>
  <div id="app" class="app-container">
    <!-- 侧边栏导航 - 仅在非登录页显示 -->
    <Sidebar v-if="!hideNavbar" />

    <!-- 主内容区 -->
    <main class="app-main" :class="{ 'with-sidebar': !hideNavbar }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 雅思助手 - 仅在登录后显示 -->
    <IELTSAssistant v-if="!hideNavbar" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import IELTSAssistant from './components/IELTSAssistant.vue';

const route = useRoute();

const hideNavbar = computed(() => route.meta.hideNavbar);
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: var(--bg-secondary);
  display: flex;
}

.app-main {
  flex: 1;
  padding: 2rem;
  transition: all 0.3s ease;
  overflow-x: hidden;
}

.app-main.with-sidebar {
  margin-left: 260px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-main.with-sidebar {
    margin-left: 0;
    margin-top: 120px; /* 为顶部导航栏留空间 */
    padding: 1rem;
  }
}
</style>