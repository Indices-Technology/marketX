import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Intercept nuxt/dist/app before Node's ESM loader tries to load the missing
// types/augments file. Without this, the entire suite fails because
// nuxt/dist/app/index.js has a bare `import "../../dist/app/types/augments"`
// which requires an exact-match filename under Node ESM.
const nuxtAppStub: import('vite').Plugin = {
  name: 'vitest-nuxt-app-stub',
  enforce: 'pre',
  resolveId(source) {
    if (
      source === 'nuxt/app' ||
      source.endsWith('nuxt/dist/app/index.js') ||
      source.endsWith('nuxt\\dist\\app\\index.js')
    ) {
      return '\0nuxt-app-stub'
    }
  },
  load(id) {
    if (id === '\0nuxt-app-stub') {
      // Re-export a minimal surface so any imports from 'nuxt/app' don't crash.
      return `
export const isVue2 = false
export const isVue3 = true
export const defineNuxtPlugin = (p) => p
export const useNuxtApp = () => ({})
export const useRuntimeConfig = () => ({ public: {} })
export const navigateTo = () => {}
export const useRoute = () => ({ params: {}, query: {}, path: '/' })
export const useRouter = () => ({ push() {}, back() {}, replace() {} })
export const useState = (_k, init) => ({ value: init ? init() : null })
export const useFetch = () => ({ data: null, pending: false, error: null })
export const useAsyncData = () => ({ data: null, pending: false })
export const defineNuxtComponent = (o) => o
`
    }
  },
}

export default defineConfig({
  plugins: [vue(), nuxtAppStub],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup-vitest.ts'],
    // Only run Vue component/page tests — Playwright handles server API tests
    include: ['layers/**/app/**/__tests__/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '~~': resolve(__dirname, '.'),
      // Prevent Nuxt virtual modules from loading nuxt/dist/app during unit tests
      '#imports': resolve(__dirname, 'tests/__mocks__/nuxt-imports.ts'),
      '#app': resolve(__dirname, 'tests/__mocks__/nuxt-imports.ts'),
    },
  },
})
