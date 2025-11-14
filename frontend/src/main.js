import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/variables.css'
import './style.css'
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize user authentication
const userStore = useUserStore()
userStore.initializeAuth()

app.mount('#app')