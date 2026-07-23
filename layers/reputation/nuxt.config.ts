// Reputation layer — the Trust Card / reputation surface described in
// docs/REPUTATION_FRAMEWORK.md. Currently ships the discovery projection
// (§5.4): the Trust Spotlight rail + TrustCard shown in the home feed.
export default defineNuxtConfig({
  components: [
    {
      path: '~/app/components',
      pathPrefix: false,
    },
  ],
})
