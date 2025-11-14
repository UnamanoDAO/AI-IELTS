<template>
  <Teleport to="body">
    <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ title }}</h3>
        </div>
        <div class="dialog-body">
          <p>{{ message }}</p>
        </div>
        <div class="dialog-actions">
          <button v-if="type === 'confirm'" @click="handleCancel" class="btn-cancel">
            取消
          </button>
          <button @click="handleConfirm" class="btn-confirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'alert', // 'alert' or 'confirm'
    validator: (value) => ['alert', 'confirm'].includes(value)
  },
  confirmText: {
    type: String,
    default: '确定'
  }
});

const emit = defineEmits(['confirm', 'cancel', 'close']);

function handleConfirm() {
  emit('confirm');
  emit('close');
}

function handleCancel() {
  emit('cancel');
  emit('close');
}

function handleOverlayClick() {
  if (props.type === 'alert') {
    handleConfirm();
  } else {
    handleCancel();
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 600;
}

.dialog-body {
  padding: 24px;
}

.dialog-body p {
  margin: 0;
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-line;
}

.dialog-actions {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f0f0f0;
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #EDB01D;
  color: #21232A;
  position: relative;
  overflow: hidden;
}

.btn-confirm::before {
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
    rgba(33, 35, 42, 0.1) 2px,
    rgba(33, 35, 42, 0.1) 4px
  );
  pointer-events: none;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(237, 176, 29, 0.3);
}

@media (max-width: 768px) {
  .dialog-content {
    width: 85%;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}
</style>
