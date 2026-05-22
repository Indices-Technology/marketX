export default defineNuxtConfig({
  components: [
    {
      path: '~/app/components',
      pathPrefix: false,
      ignore: ['**/dassa/**'],
    },
    {
      path: '~/app/components/dassa',
      prefix: 'Dassa',
      pathPrefix: false,
    },
  ],
  modules: ['@pinia/nuxt'],
})
