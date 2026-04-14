export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
    },
  },

  app: {
    head: {
      title: 'Ressources relationnelles',
      htmlAttrs: {
        lang: 'fr',
      },
      link: [
        { rel: 'stylesheet', href: '/dsfr/dsfr/dsfr.min.css' },
        { rel: 'stylesheet', href: '/dsfr/utility/utility.min.css' },
        { rel: 'stylesheet', href: '/dsfr/utility/icons/icons.min.css' }
      ],
      script: [
        { src: '/dsfr/dsfr/dsfr.module.min.js', type: 'module' },
        { src: '/dsfr/dsfr/dsfr.nomodule.min.js', nomodule: true }
      ]
    }
  }
})