import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { useRuntimeConfig } from '#app'

const socket = ref<Socket | null>(null)
const isConnected = ref(false)

export const useDassaSocket = () => {
  const config = useRuntimeConfig()

  const connect = (token: string, onConnected?: () => void) => {
    if (socket.value?.connected) return

    socket.value?.disconnect()
    socket.value = null

    const url = (config.public.dassaSocketUrl as string) || 'http://localhost:4000'

    socket.value = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      onConnected?.()
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
    })
  }

  const disconnect = () => {
    socket.value?.removeAllListeners()
    socket.value?.disconnect()
    socket.value = null
    isConnected.value = false
  }

  return { socket, isConnected, connect, disconnect }
}
