import { ref } from 'vue'
import { useDassaSocket } from './useDassaSocket'

export interface DassaProductItem {
  id: string | number
  name: string
  price: number
  currency: string
  seller?: string
  imageUrl?: string
  inStock: boolean
  slug?: string
}

export interface DassaMessageMetadata {
  toolsInvoked?: string[]
  products?: DassaProductItem[]
  cart?: { items: unknown[]; subtotal: number; count: number }
  cartUpdate?: { success: boolean; message: string }
  orderTracking?: unknown
  quickReplies?: string[]
}

export interface DassaMessage {
  id: string
  role: 'user' | 'bot' | 'system'
  content: string
  metadata?: DassaMessageMetadata
  createdAt: Date
}

// Module-level state — survives component remounts (bottom sheet open/close)
const messages      = ref<DassaMessage[]>([])
const isTyping      = ref(false)
const isInitialized = ref(false)

export const useDassaChat = () => {
  const { socket, isConnected, connect, disconnect } = useDassaSocket()

  const init = (token: string, sessionType: 'buyer' | 'seller' = 'buyer') => {
    if (isInitialized.value) {
      // Already connected — re-emit session type in case it changed
      socket.value?.emit('session:type', sessionType)
      return
    }

    connect(token, () => {
      socket.value?.emit('session:type', sessionType)
    })

    socket.value?.on('chat:history', (history: DassaMessage[]) => {
      messages.value = history.map((m) => ({ ...m, createdAt: new Date(m.createdAt) }))
    })

    socket.value?.on('chat:message', (msg: DassaMessage) => {
      messages.value.push({ ...msg, createdAt: new Date(msg.createdAt) })
    })

    socket.value?.on('chat:typing', (status: boolean) => {
      isTyping.value = status
    })

    isInitialized.value = true
  }

  const send = (content: string) => {
    if (!socket.value || !content.trim()) return
    messages.value.push({
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    })
    socket.value.emit('chat:send', { content, sessionId: null })
  }

  const reset = () => {
    messages.value = []
    isTyping.value = false
    isInitialized.value = false
    disconnect()
  }

  return { messages, isTyping, isConnected, isInitialized, init, send, reset }
}
