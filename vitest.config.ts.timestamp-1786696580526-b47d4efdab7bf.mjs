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
    // Vue component tests (app layer) + pure server utility unit tests.
    // Playwright's api project only matches layers/**/server/**/__tests__, so
    // root-level server/utils specs run here and nowhere else.
    include: [
      "layers/**/app/**/__tests__/**/*.spec.ts",
      "layers/**/server/utils/__tests__/**/*.spec.ts",
      "server/utils/__tests__/**/*.spec.ts",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFBSRUNJU0lPTiA3NTMwXFxcXHNvdXJjZVxcXFxyZXBvc1xcXFxJTkRJQ0VTXFxcXG1hcmtldFhcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFBSRUNJU0lPTiA3NTMwXFxcXHNvdXJjZVxcXFxyZXBvc1xcXFxJTkRJQ0VTXFxcXG1hcmtldFhcXFxcdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvUFJFQ0lTSU9OJTIwNzUzMC9zb3VyY2UvcmVwb3MvSU5ESUNFUy9tYXJrZXRYL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXHJcblxyXG4vLyBJbnRlcmNlcHQgbnV4dC9kaXN0L2FwcCBiZWZvcmUgTm9kZSdzIEVTTSBsb2FkZXIgdHJpZXMgdG8gbG9hZCB0aGUgbWlzc2luZ1xyXG4vLyB0eXBlcy9hdWdtZW50cyBmaWxlLiBXaXRob3V0IHRoaXMsIHRoZSBlbnRpcmUgc3VpdGUgZmFpbHMgYmVjYXVzZVxyXG4vLyBudXh0L2Rpc3QvYXBwL2luZGV4LmpzIGhhcyBhIGJhcmUgYGltcG9ydCBcIi4uLy4uL2Rpc3QvYXBwL3R5cGVzL2F1Z21lbnRzXCJgXHJcbi8vIHdoaWNoIHJlcXVpcmVzIGFuIGV4YWN0LW1hdGNoIGZpbGVuYW1lIHVuZGVyIE5vZGUgRVNNLlxyXG5jb25zdCBudXh0QXBwU3R1YjogaW1wb3J0KCd2aXRlJykuUGx1Z2luID0ge1xyXG4gIG5hbWU6ICd2aXRlc3QtbnV4dC1hcHAtc3R1YicsXHJcbiAgZW5mb3JjZTogJ3ByZScsXHJcbiAgcmVzb2x2ZUlkKHNvdXJjZSkge1xyXG4gICAgaWYgKFxyXG4gICAgICBzb3VyY2UgPT09ICdudXh0L2FwcCcgfHxcclxuICAgICAgc291cmNlLmVuZHNXaXRoKCdudXh0L2Rpc3QvYXBwL2luZGV4LmpzJykgfHxcclxuICAgICAgc291cmNlLmVuZHNXaXRoKCdudXh0XFxcXGRpc3RcXFxcYXBwXFxcXGluZGV4LmpzJylcclxuICAgICkge1xyXG4gICAgICByZXR1cm4gJ1xcMG51eHQtYXBwLXN0dWInXHJcbiAgICB9XHJcbiAgfSxcclxuICBsb2FkKGlkKSB7XHJcbiAgICBpZiAoaWQgPT09ICdcXDBudXh0LWFwcC1zdHViJykge1xyXG4gICAgICAvLyBSZS1leHBvcnQgYSBtaW5pbWFsIHN1cmZhY2Ugc28gYW55IGltcG9ydHMgZnJvbSAnbnV4dC9hcHAnIGRvbid0IGNyYXNoLlxyXG4gICAgICByZXR1cm4gYFxyXG5leHBvcnQgY29uc3QgaXNWdWUyID0gZmFsc2VcclxuZXhwb3J0IGNvbnN0IGlzVnVlMyA9IHRydWVcclxuZXhwb3J0IGNvbnN0IGRlZmluZU51eHRQbHVnaW4gPSAocCkgPT4gcFxyXG5leHBvcnQgY29uc3QgdXNlTnV4dEFwcCA9ICgpID0+ICh7fSlcclxuZXhwb3J0IGNvbnN0IHVzZVJ1bnRpbWVDb25maWcgPSAoKSA9PiAoeyBwdWJsaWM6IHt9IH0pXHJcbmV4cG9ydCBjb25zdCBuYXZpZ2F0ZVRvID0gKCkgPT4ge31cclxuZXhwb3J0IGNvbnN0IHVzZVJvdXRlID0gKCkgPT4gKHsgcGFyYW1zOiB7fSwgcXVlcnk6IHt9LCBwYXRoOiAnLycgfSlcclxuZXhwb3J0IGNvbnN0IHVzZVJvdXRlciA9ICgpID0+ICh7IHB1c2goKSB7fSwgYmFjaygpIHt9LCByZXBsYWNlKCkge30gfSlcclxuZXhwb3J0IGNvbnN0IHVzZVN0YXRlID0gKF9rLCBpbml0KSA9PiAoeyB2YWx1ZTogaW5pdCA/IGluaXQoKSA6IG51bGwgfSlcclxuZXhwb3J0IGNvbnN0IHVzZUZldGNoID0gKCkgPT4gKHsgZGF0YTogbnVsbCwgcGVuZGluZzogZmFsc2UsIGVycm9yOiBudWxsIH0pXHJcbmV4cG9ydCBjb25zdCB1c2VBc3luY0RhdGEgPSAoKSA9PiAoeyBkYXRhOiBudWxsLCBwZW5kaW5nOiBmYWxzZSB9KVxyXG5leHBvcnQgY29uc3QgZGVmaW5lTnV4dENvbXBvbmVudCA9IChvKSA9PiBvXHJcbmBcclxuICAgIH1cclxuICB9LFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFt2dWUoKSwgbnV4dEFwcFN0dWJdLFxyXG4gIHRlc3Q6IHtcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcclxuICAgIHNldHVwRmlsZXM6IFsnLi90ZXN0cy9zZXR1cC12aXRlc3QudHMnXSxcclxuICAgIC8vIFZ1ZSBjb21wb25lbnQgdGVzdHMgKGFwcCBsYXllcikgKyBwdXJlIHNlcnZlciB1dGlsaXR5IHVuaXQgdGVzdHMuXHJcbiAgICAvLyBQbGF5d3JpZ2h0J3MgYXBpIHByb2plY3Qgb25seSBtYXRjaGVzIGxheWVycy8qKi9zZXJ2ZXIvKiovX190ZXN0c19fLCBzb1xyXG4gICAgLy8gcm9vdC1sZXZlbCBzZXJ2ZXIvdXRpbHMgc3BlY3MgcnVuIGhlcmUgYW5kIG5vd2hlcmUgZWxzZS5cclxuICAgIGluY2x1ZGU6IFtcclxuICAgICAgJ2xheWVycy8qKi9hcHAvKiovX190ZXN0c19fLyoqLyouc3BlYy50cycsXHJcbiAgICAgICdsYXllcnMvKiovc2VydmVyL3V0aWxzL19fdGVzdHNfXy8qKi8qLnNwZWMudHMnLFxyXG4gICAgICAnc2VydmVyL3V0aWxzL19fdGVzdHNfXy8qKi8qLnNwZWMudHMnLFxyXG4gICAgICAnc2hhcmVkLyoqL19fdGVzdHNfXy8qKi8qLnNwZWMudHMnLFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICd+JzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuJyksXHJcbiAgICAgICd+fic6IHJlc29sdmUoX19kaXJuYW1lLCAnLicpLFxyXG4gICAgICAvLyBQcmV2ZW50IE51eHQgdmlydHVhbCBtb2R1bGVzIGZyb20gbG9hZGluZyBudXh0L2Rpc3QvYXBwIGR1cmluZyB1bml0IHRlc3RzXHJcbiAgICAgICcjaW1wb3J0cyc6IHJlc29sdmUoX19kaXJuYW1lLCAndGVzdHMvX19tb2Nrc19fL251eHQtaW1wb3J0cy50cycpLFxyXG4gICAgICAnI2FwcCc6IHJlc29sdmUoX19kaXJuYW1lLCAndGVzdHMvX19tb2Nrc19fL251eHQtaW1wb3J0cy50cycpLFxyXG4gICAgfSxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtXLFNBQVMsb0JBQW9CO0FBQy9YLE9BQU8sU0FBUztBQUNoQixTQUFTLGVBQWU7QUFGeEIsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTSxjQUFxQztBQUFBLEVBQ3pDLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxFQUNULFVBQVUsUUFBUTtBQUNoQixRQUNFLFdBQVcsY0FDWCxPQUFPLFNBQVMsd0JBQXdCLEtBQ3hDLE9BQU8sU0FBUywyQkFBMkIsR0FDM0M7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLEtBQUssSUFBSTtBQUNQLFFBQUksT0FBTyxtQkFBbUI7QUFFNUIsYUFBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFjVDtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxJQUFJLEdBQUcsV0FBVztBQUFBLEVBQzVCLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQyx5QkFBeUI7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUl0QyxTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsa0NBQVcsR0FBRztBQUFBLE1BQzNCLE1BQU0sUUFBUSxrQ0FBVyxHQUFHO0FBQUE7QUFBQSxNQUU1QixZQUFZLFFBQVEsa0NBQVcsaUNBQWlDO0FBQUEsTUFDaEUsUUFBUSxRQUFRLGtDQUFXLGlDQUFpQztBQUFBLElBQzlEO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
