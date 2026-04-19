export default defineNuxtConfig({
  components: [{ path: '~/app/components', pathPrefix: false }],
  imports: {
    dirs: ['composables', 'stores', 'utils'],
  },
})
