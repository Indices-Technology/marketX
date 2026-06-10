import { ref } from 'vue'

// Module-level singleton — survives component remounts
const _isOpen = ref(false)
const _pendingMessage = ref<string | null>(null)

export function useDassaPanel() {
  function openWith(message: string) {
    _pendingMessage.value = message
    _isOpen.value = true
  }

  function close() {
    _isOpen.value = false
  }

  function takePending(): string | null {
    const msg = _pendingMessage.value
    _pendingMessage.value = null
    return msg
  }

  return { isOpen: _isOpen, pendingMessage: _pendingMessage, openWith, close, takePending }
}
