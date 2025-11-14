import { ref } from 'vue';

const dialogState = ref({
  show: false,
  title: '',
  message: '',
  type: 'alert',
  confirmText: '确定',
  resolve: null,
  reject: null
});

export function useDialog() {
  function showAlert(message, title = '提示') {
    return new Promise((resolve) => {
      dialogState.value = {
        show: true,
        title,
        message,
        type: 'alert',
        confirmText: '确定',
        resolve,
        reject: null
      };
    });
  }

  function showConfirm(message, title = '确认') {
    return new Promise((resolve, reject) => {
      dialogState.value = {
        show: true,
        title,
        message,
        type: 'confirm',
        confirmText: '确定',
        resolve,
        reject
      };
    });
  }

  function handleConfirm() {
    dialogState.value.show = false;
    if (dialogState.value.resolve) {
      dialogState.value.resolve(true);
    }
  }

  function handleCancel() {
    dialogState.value.show = false;
    if (dialogState.value.reject) {
      dialogState.value.reject(false);
    } else if (dialogState.value.resolve) {
      dialogState.value.resolve(false);
    }
  }

  function handleClose() {
    dialogState.value.show = false;
  }

  return {
    dialogState,
    showAlert,
    showConfirm,
    handleConfirm,
    handleCancel,
    handleClose
  };
}
