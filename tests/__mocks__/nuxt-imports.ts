// Minimal stub for Nuxt virtual modules (#imports, #app).
// Prevents Nuxt runtime from loading during Vitest component tests.
export * from 'vue'
export const useState = (_key: string, init?: () => unknown) => ({ value: init ? init() : null })
export const useRoute = () => ({ params: {}, query: {}, path: '/', fullPath: '/' })
export const useRouter = () => ({ push: () => {}, back: () => {}, go: () => {}, replace: () => {} })
export const navigateTo = () => {}
export const defineNuxtComponent = (opts: Record<string, unknown>) => opts
export const useNuxtApp = () => ({ $fetch: () => Promise.resolve(null) })
export const useRuntimeConfig = () => ({ public: {} })
