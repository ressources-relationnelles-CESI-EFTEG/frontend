// https://nuxt.com/docs/api/configuration/nuxt-config
//export default defineNuxtConfig({
//  compatibilityDate: '2025-07-15',
//  devtools: { enabled: true },
//  runtimeConfig: {
//    public: {
//      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
//    },
//  },
//});

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: '/dsfr/dsfr/dsfr.min.css' },
        { rel: 'stylesheet', href: '/dsfr/utility/utility.min.css' },
        { rel: 'stylesheet', href: '/dsfr/utility/icons/icons.min.css' },
      ],
      script: [
        { src: '/dsfr/dsfr/dsfr.module.min.js', type: 'module' },
      ],
    },
  },
})