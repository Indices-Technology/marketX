// vitest.config.ts
import { defineConfig } from "file:///C:/Users/PRECISION%207530/source/repos/INDICES/marketX/node_modules/vitest/dist/config.js";
import vue from "file:///C:/Users/PRECISION%207530/source/repos/INDICES/marketX/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "C:\\Users\\PRECISION 7530\\source\\repos\\INDICES\\marketX";
var nuxtAppStub = {
  name: "vitest-nuxt-app-stub",
  enforce: "pre",
  resolveId(source) {
    if (source === "nuxt/app" || source.endsWith("nuxt/dist/app/index.js") || source.endsWith("nuxt\\dist\\app\\index.js")) {
      return "\0nuxt-app-stub";
    }
  },
  load(id) {
    if (id === "\0nuxt-app-stub") {
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
`;
    }
  }
};
var vitest_config_default = defineConfig({
  plugins: [vue(), nuxtAppStub],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup-vitest.ts"],
    // Vue component tests (app layer) + pure server utility unit tests
    include: [
      "layers/**/app/**/__tests__/**/*.spec.ts",
      "layers/**/server/utils/__tests__/**/*.spec.ts",
      "shared/**/__tests__/**/*.spec.ts"
    ]
  },
  resolve: {
    alias: {
      "~": resolve(__vite_injected_original_dirname, "."),
      "~~": resolve(__vite_injected_original_dirname, "."),
      // Prevent Nuxt virtual modules from loading nuxt/dist/app during unit tests
      "#imports": resolve(__vite_injected_original_dirname, "tests/__mocks__/nuxt-imports.ts"),
      "#app": resolve(__vite_injected_original_dirname, "tests/__mocks__/nuxt-imports.ts")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFBSRUNJU0lPTiA3NTMwXFxcXHNvdXJjZVxcXFxyZXBvc1xcXFxJTkRJQ0VTXFxcXG1hcmtldFhcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFBSRUNJU0lPTiA3NTMwXFxcXHNvdXJjZVxcXFxyZXBvc1xcXFxJTkRJQ0VTXFxcXG1hcmtldFhcXFxcdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvUFJFQ0lTSU9OJTIwNzUzMC9zb3VyY2UvcmVwb3MvSU5ESUNFUy9tYXJrZXRYL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcblxuLy8gSW50ZXJjZXB0IG51eHQvZGlzdC9hcHAgYmVmb3JlIE5vZGUncyBFU00gbG9hZGVyIHRyaWVzIHRvIGxvYWQgdGhlIG1pc3Npbmdcbi8vIHR5cGVzL2F1Z21lbnRzIGZpbGUuIFdpdGhvdXQgdGhpcywgdGhlIGVudGlyZSBzdWl0ZSBmYWlscyBiZWNhdXNlXG4vLyBudXh0L2Rpc3QvYXBwL2luZGV4LmpzIGhhcyBhIGJhcmUgYGltcG9ydCBcIi4uLy4uL2Rpc3QvYXBwL3R5cGVzL2F1Z21lbnRzXCJgXG4vLyB3aGljaCByZXF1aXJlcyBhbiBleGFjdC1tYXRjaCBmaWxlbmFtZSB1bmRlciBOb2RlIEVTTS5cbmNvbnN0IG51eHRBcHBTdHViOiBpbXBvcnQoJ3ZpdGUnKS5QbHVnaW4gPSB7XG4gIG5hbWU6ICd2aXRlc3QtbnV4dC1hcHAtc3R1YicsXG4gIGVuZm9yY2U6ICdwcmUnLFxuICByZXNvbHZlSWQoc291cmNlKSB7XG4gICAgaWYgKFxuICAgICAgc291cmNlID09PSAnbnV4dC9hcHAnIHx8XG4gICAgICBzb3VyY2UuZW5kc1dpdGgoJ251eHQvZGlzdC9hcHAvaW5kZXguanMnKSB8fFxuICAgICAgc291cmNlLmVuZHNXaXRoKCdudXh0XFxcXGRpc3RcXFxcYXBwXFxcXGluZGV4LmpzJylcbiAgICApIHtcbiAgICAgIHJldHVybiAnXFwwbnV4dC1hcHAtc3R1YidcbiAgICB9XG4gIH0sXG4gIGxvYWQoaWQpIHtcbiAgICBpZiAoaWQgPT09ICdcXDBudXh0LWFwcC1zdHViJykge1xuICAgICAgLy8gUmUtZXhwb3J0IGEgbWluaW1hbCBzdXJmYWNlIHNvIGFueSBpbXBvcnRzIGZyb20gJ251eHQvYXBwJyBkb24ndCBjcmFzaC5cbiAgICAgIHJldHVybiBgXG5leHBvcnQgY29uc3QgaXNWdWUyID0gZmFsc2VcbmV4cG9ydCBjb25zdCBpc1Z1ZTMgPSB0cnVlXG5leHBvcnQgY29uc3QgZGVmaW5lTnV4dFBsdWdpbiA9IChwKSA9PiBwXG5leHBvcnQgY29uc3QgdXNlTnV4dEFwcCA9ICgpID0+ICh7fSlcbmV4cG9ydCBjb25zdCB1c2VSdW50aW1lQ29uZmlnID0gKCkgPT4gKHsgcHVibGljOiB7fSB9KVxuZXhwb3J0IGNvbnN0IG5hdmlnYXRlVG8gPSAoKSA9PiB7fVxuZXhwb3J0IGNvbnN0IHVzZVJvdXRlID0gKCkgPT4gKHsgcGFyYW1zOiB7fSwgcXVlcnk6IHt9LCBwYXRoOiAnLycgfSlcbmV4cG9ydCBjb25zdCB1c2VSb3V0ZXIgPSAoKSA9PiAoeyBwdXNoKCkge30sIGJhY2soKSB7fSwgcmVwbGFjZSgpIHt9IH0pXG5leHBvcnQgY29uc3QgdXNlU3RhdGUgPSAoX2ssIGluaXQpID0+ICh7IHZhbHVlOiBpbml0ID8gaW5pdCgpIDogbnVsbCB9KVxuZXhwb3J0IGNvbnN0IHVzZUZldGNoID0gKCkgPT4gKHsgZGF0YTogbnVsbCwgcGVuZGluZzogZmFsc2UsIGVycm9yOiBudWxsIH0pXG5leHBvcnQgY29uc3QgdXNlQXN5bmNEYXRhID0gKCkgPT4gKHsgZGF0YTogbnVsbCwgcGVuZGluZzogZmFsc2UgfSlcbmV4cG9ydCBjb25zdCBkZWZpbmVOdXh0Q29tcG9uZW50ID0gKG8pID0+IG9cbmBcbiAgICB9XG4gIH0sXG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFt2dWUoKSwgbnV4dEFwcFN0dWJdLFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBzZXR1cEZpbGVzOiBbJy4vdGVzdHMvc2V0dXAtdml0ZXN0LnRzJ10sXG4gICAgLy8gVnVlIGNvbXBvbmVudCB0ZXN0cyAoYXBwIGxheWVyKSArIHB1cmUgc2VydmVyIHV0aWxpdHkgdW5pdCB0ZXN0c1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdsYXllcnMvKiovYXBwLyoqL19fdGVzdHNfXy8qKi8qLnNwZWMudHMnLFxuICAgICAgJ2xheWVycy8qKi9zZXJ2ZXIvdXRpbHMvX190ZXN0c19fLyoqLyouc3BlYy50cycsXG4gICAgICAnc2hhcmVkLyoqL19fdGVzdHNfXy8qKi8qLnNwZWMudHMnLFxuICAgIF0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ34nOiByZXNvbHZlKF9fZGlybmFtZSwgJy4nKSxcbiAgICAgICd+fic6IHJlc29sdmUoX19kaXJuYW1lLCAnLicpLFxuICAgICAgLy8gUHJldmVudCBOdXh0IHZpcnR1YWwgbW9kdWxlcyBmcm9tIGxvYWRpbmcgbnV4dC9kaXN0L2FwcCBkdXJpbmcgdW5pdCB0ZXN0c1xuICAgICAgJyNpbXBvcnRzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICd0ZXN0cy9fX21vY2tzX18vbnV4dC1pbXBvcnRzLnRzJyksXG4gICAgICAnI2FwcCc6IHJlc29sdmUoX19kaXJuYW1lLCAndGVzdHMvX19tb2Nrc19fL251eHQtaW1wb3J0cy50cycpLFxuICAgIH0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrVyxTQUFTLG9CQUFvQjtBQUMvWCxPQUFPLFNBQVM7QUFDaEIsU0FBUyxlQUFlO0FBRnhCLElBQU0sbUNBQW1DO0FBUXpDLElBQU0sY0FBcUM7QUFBQSxFQUN6QyxNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsRUFDVCxVQUFVLFFBQVE7QUFDaEIsUUFDRSxXQUFXLGNBQ1gsT0FBTyxTQUFTLHdCQUF3QixLQUN4QyxPQUFPLFNBQVMsMkJBQTJCLEdBQzNDO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQUEsRUFDQSxLQUFLLElBQUk7QUFDUCxRQUFJLE9BQU8sbUJBQW1CO0FBRTVCLGFBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBY1Q7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsSUFBSSxHQUFHLFdBQVc7QUFBQSxFQUM1QixNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMseUJBQXlCO0FBQUE7QUFBQSxJQUV0QyxTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxHQUFHO0FBQUEsTUFDM0IsTUFBTSxRQUFRLGtDQUFXLEdBQUc7QUFBQTtBQUFBLE1BRTVCLFlBQVksUUFBUSxrQ0FBVyxpQ0FBaUM7QUFBQSxNQUNoRSxRQUFRLFFBQVEsa0NBQVcsaUNBQWlDO0FBQUEsSUFDOUQ7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
