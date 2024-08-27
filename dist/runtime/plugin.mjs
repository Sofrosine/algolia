import { defineNuxtPlugin, useRuntimeConfig } from "#imports";
import { createInMemoryCache } from "@algolia/cache-in-memory";
import { createFetchRequester } from "@algolia/requester-fetch";
export default defineNuxtPlugin(async (nuxtApp) => {
  const { applicationId, apiKey, lite, recommend, cache } = useRuntimeConfig().public.algolia;
  const algoliasearch = lite ? await import("algoliasearch/dist/algoliasearch-lite.esm.browser").then((lib) => lib.default || lib) : await import("algoliasearch/dist/algoliasearch.esm.browser").then((lib) => lib.default || lib);
  const algoliaSearchClient = cache ? algoliasearch(applicationId, apiKey, { responsesCache: createInMemoryCache(), requestsCache: createInMemoryCache({ serializable: false }), requester: createFetchRequester() }) : algoliasearch(applicationId, apiKey, { requester: createFetchRequester() });
  nuxtApp.provide("algolia", algoliaSearchClient);
  if (recommend) {
    const algoliaRecommend = await import("@algolia/recommend/dist/recommend.esm.browser").then((lib) => lib.default || lib);
    nuxtApp.provide("algoliaRecommend", algoliaRecommend(applicationId, apiKey));
  }
});
