<template>
  <div class="articles-page">
    <div class="container">
      <div class="header">
        <h1>阅读理解学习</h1>
        <button @click="showImportDialog = true" class="btn-primary">
          <span class="icon">📝</span> 导入文章
        </button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="articles.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>还没有导入任何文章</p>
        <button @click="showImportDialog = true" class="btn-primary">
          开始导入第一篇文章
        </button>
      </div>

      <div v-else class="articles-grid">
        <div
          v-for="article in articles"
          :key="article.id"
          class="article-card"
          @click="goToReading(article.id)"
        >
          <div class="article-header">
            <h3>{{ article.title }}</h3>
            <span class="difficulty-badge" :class="article.difficulty">
              {{ difficultyLabel(article.difficulty) }}
            </span>
          </div>
          <div class="article-info">
            <span class="word-count">📊 {{ article.word_count }} 词</span>
            <span class="date">{{ formatDate(article.created_at) }}</span>
          </div>
          <div v-if="article.source" class="article-source">
            来源: {{ article.source }}
          </div>
          <div class="article-actions" @click.stop>
            <button @click="editArticle(article)" class="btn-icon" title="编辑">
              ✏️
            </button>
            <button @click="deleteArticle(article.id)" class="btn-icon btn-danger" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Import Dialog -->
      <div v-if="showImportDialog" class="modal-overlay" @click="closeImportDialog">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ editingArticle ? '编辑文章' : '导入新文章' }}</h2>
            <button @click="closeImportDialog" class="btn-close">×</button>
          </div>
          <form @submit.prevent="submitArticle" class="import-form">
            <div class="form-group">
              <label for="title">文章标题 *</label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                placeholder="输入文章标题"
                required
              />
            </div>

            <div class="form-group">
              <label for="content">文章内容 *</label>
              <textarea
                id="content"
                v-model="form.content"
                rows="12"
                placeholder="粘贴英文文章内容..."
                required
              ></textarea>
              <div class="textarea-info">
                <span>字数: {{ wordCount }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="source">来源</label>
                <input
                  id="source"
                  v-model="form.source"
                  type="text"
                  placeholder="文章来源（可选）"
                />
              </div>

              <div class="form-group">
                <label for="difficulty">难度</label>
                <select id="difficulty" v-model="form.difficulty">
                  <option value="beginner">初级</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeImportDialog" class="btn-secondary">
                取消
              </button>
              <button type="submit" class="btn-primary" :disabled="submitting">
                {{ submitting ? '保存中...' : (editingArticle ? '保存' : '导入') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { articlesAPI } from '../api';

const router = useRouter();

const articles = ref([]);
const loading = ref(false);
const showImportDialog = ref(false);
const submitting = ref(false);
const editingArticle = ref(null);

const form = ref({
  title: '',
  content: '',
  source: '',
  difficulty: 'intermediate'
});

const wordCount = computed(() => {
  return form.value.content.split(/\s+/).filter(w => w.length > 0).length;
});

const difficultyLabel = (level) => {
  const labels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  };
  return labels[level] || level;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const fetchArticles = async () => {
  loading.value = true;
  try {
    articles.value = await articlesAPI.getAll();
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    alert('加载文章列表失败');
  } finally {
    loading.value = false;
  }
};

const submitArticle = async () => {
  if (!form.value.title || !form.value.content) {
    alert('请填写标题和内容');
    return;
  }

  submitting.value = true;
  try {
    if (editingArticle.value) {
      await articlesAPI.update(editingArticle.value.id, form.value);
    } else {
      await articlesAPI.create(form.value);
    }
    await fetchArticles();
    closeImportDialog();
    alert(editingArticle.value ? '文章已更新' : '文章导入成功！');
  } catch (error) {
    console.error('Failed to submit article:', error);
    alert('保存失败，请重试');
  } finally {
    submitting.value = false;
  }
};

const editArticle = (article) => {
  editingArticle.value = article;
  form.value = {
    title: article.title,
    content: article.content,
    source: article.source || '',
    difficulty: article.difficulty
  };
  showImportDialog.value = true;
};

const deleteArticle = async (id) => {
  if (!confirm('确定要删除这篇文章吗？')) return;

  try {
    await articlesAPI.delete(id);
    await fetchArticles();
  } catch (error) {
    console.error('Failed to delete article:', error);
    alert('删除失败，请重试');
  }
};

const closeImportDialog = () => {
  showImportDialog.value = false;
  editingArticle.value = null;
  form.value = {
    title: '',
    content: '',
    source: '',
    difficulty: 'intermediate'
  };
};

const goToReading = (articleId) => {
  router.push(`/reading-comprehension/${articleId}`);
};

onMounted(() => {
  fetchArticles();
});
</script>

<style scoped>
.articles-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef3 100%);
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  color: #21232A;
}

.header h1 {
  font-size: 2rem;
  margin: 0;
}

.btn-primary {
  background: #EDB01D;
  color: #21232A;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(237, 176, 29, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: #666;
  font-size: 1.2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.article-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.article-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
  flex: 1;
  margin-right: 0.5rem;
}

.difficulty-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.difficulty-badge.beginner {
  background: #d4edda;
  color: #155724;
}

.difficulty-badge.intermediate {
  background: #fff3cd;
  color: #856404;
}

.difficulty-badge.advanced {
  background: #f8d7da;
  color: #721c24;
}

.article-info {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.article-source {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
  margin-top: 0.5rem;
}

.article-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
}

.btn-danger:hover {
  background: #ffebee;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.import-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #EDB01D;
}

.textarea-info {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

@media (max-width: 768px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
