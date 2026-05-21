export default defineNuxtConfig({
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      ignore: ['**/dassa/**'],
    },
    {
      path: '~/components/dassa',
      prefix: 'Dassa',
      pathPrefix: false,
    },
  ],
  modules: ['@pinia/nuxt'],
})
