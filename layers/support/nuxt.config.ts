export default defineNuxtConfig({
  // Support layer — help centre, support tickets, and order disputes.
  // Server routes in server/api/support/, UI pages in app/pages/support/
  components: [
    {
      path: '~/app/components',
      pathPrefix: false,
    },
  ],
})
