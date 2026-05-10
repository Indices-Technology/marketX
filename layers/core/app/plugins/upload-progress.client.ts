import UploadProgressBar from '../components/UploadProgressBar.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('UploadProgressBar', UploadProgressBar)
})
