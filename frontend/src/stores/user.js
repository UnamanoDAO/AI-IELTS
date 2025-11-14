import { defineStore } from 'pinia';
import api from '@/api';

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    token: localStorage.getItem('auth_token') || null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    username: (state) => state.currentUser?.username || ''
  },

  actions: {
    async register(username, password) {
      const data = await api.post('/auth/register', { username, password });
      this.token = data.token;
      this.currentUser = {
        userId: data.userId,
        username: data.username
      };
      localStorage.setItem('auth_token', this.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    },

    async login(username, password) {
      const data = await api.post('/auth/login', { username, password });
      this.token = data.token;
      this.currentUser = {
        userId: data.userId,
        username: data.username
      };
      localStorage.setItem('auth_token', this.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    },

    async fetchCurrentUser() {
      if (!this.token) return;

      try {
        const data = await api.get('/auth/me');
        this.currentUser = data;
      } catch (error) {
        // Token invalid, clear auth
        this.logout();
      }
    },

    logout() {
      this.token = null;
      this.currentUser = null;
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
    },

    initializeAuth() {
      if (this.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        this.fetchCurrentUser();
      }
    }
  }
});
