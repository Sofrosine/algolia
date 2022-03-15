import { defineNuxtPlugin, NuxtApp, useRuntimeConfig } from '#app'
import { SearchClient } from 'algoliasearch/lite'

export default defineNuxtPlugin(async (nuxtApp: NuxtApp) => {
  const { applicationId, apiKey, lite, instantSearch, recommend } = useRuntimeConfig().algolia

  // Have to import algoliasearch directly from esm.browser because algoliasearch by default provides umd.js file which causes Nuxt to throw error
  // Also, cannot use simple string interpolation due to error 'Cannot read property 'stubModule' of undefined'
  const algoliasearch = lite
    ? await import('algoliasearch/dist/algoliasearch-lite.esm.browser').then(lib => lib.default || lib)
    : await import('algoliasearch/dist/algoliasearch.esm.browser').then(lib => lib.default || lib)

  const algoliaSearchClient: SearchClient = algoliasearch(applicationId, apiKey)

  nuxtApp.provide('algolia', algoliaSearchClient)

  if (instantSearch) {
    const { plugin } = await import('vue-instantsearch/vue3/es/src/plugin')

    nuxtApp.vueApp.use(plugin)
  }

  if (recommend) {
    const algoliaRecommend = await import('@algolia/recommend').then(lib => lib.default || lib)
    nuxtApp.provide('algoliaRecommend', algoliaRecommend(applicationId, apiKey))
  }
})
