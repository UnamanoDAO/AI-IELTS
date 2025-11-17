import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Learn from '@/views/Learn.vue'
import Quiz from '@/views/Quiz.vue'
import Reading from '@/views/Reading.vue'
import MainMenu from '@/views/MainMenu.vue'
import Login from '@/views/Login.vue'
import VocabularyBook from '@/views/VocabularyBook.vue'
import VocabularyDetail from '@/views/VocabularyDetail.vue'
import VocabularyTest from '@/views/VocabularyTest.vue'
import ArticlesView from '@/views/ArticlesView.vue'
import ReadingView from '@/views/ReadingView.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/vocabulary-book'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { title: '登录/注册', hideNavbar: true }
    },
    {
      path: '/units',
      name: 'Home',
      component: Home,
      meta: { title: '课程单元', requiresAuth: true }
    },
    {
      path: '/learn/:unitId',
      name: 'Learn',
      component: Learn,
      meta: { title: '学习模式', requiresAuth: true }
    },
    {
      path: '/quiz/:unitId',
      name: 'Quiz',
      component: Quiz,
      meta: { title: '测验模式', requiresAuth: true }
    },
    {
      path: '/reading/:unitId',
      name: 'Reading',
      component: Reading,
      meta: { title: '阅读文章', requiresAuth: true }
    },
    {
      path: '/vocabulary-book',
      name: 'VocabularyBook',
      component: VocabularyBook,
      meta: { title: '我的单词本', requiresAuth: true }
    },
    {
      path: '/vocabulary-book/:id',
      name: 'VocabularyDetail',
      component: VocabularyDetail,
      meta: { title: '单词详情', requiresAuth: true }
    },
    {
      path: '/vocabulary-test',
      name: 'VocabularyTest',
      component: VocabularyTest,
      meta: { title: '连线测试', requiresAuth: true }
    },
    {
      path: '/reading-comprehension',
      name: 'ReadingComprehension',
      component: ArticlesView,
      meta: { title: '阅读理解学习', requiresAuth: true }
    },
    {
      path: '/reading-comprehension/:id',
      name: 'ReadingArticle',
      component: ReadingView,
      meta: { title: '阅读文章', requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'IELTS 词汇学习'

  // Check authentication for protected routes
  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isAuthenticated) {
      next('/login')
      return
    }
  }

  next()
})

export default router