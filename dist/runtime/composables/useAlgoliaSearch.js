import { computed } from "vue";
import { useAlgoliaInitIndex } from "./useAlgoliaInitIndex.js";
import { useState, useRuntimeConfig, useNuxtApp } from "#imports";
export function useAlgoliaSearch(indexName) {
  const config = useRuntimeConfig();
  const index = indexName || config.public.algolia.globalIndex;
  if (!index) throw new Error("`[@nuxtjs/algolia]` Cannot search in Algolia without `globalIndex` or `indexName` passed as a parameter");
  const algoliaIndex = useAlgoliaInitIndex(index);
  const result = useState(`${index}-search-result`, () => null);
  const search = async ({ query, requestOptions }) => {
    if (import.meta.server) {
      const nuxtApp = useNuxtApp();
      if (config.public.algolia.useFetch) {
        nuxtApp.$algolia.transporter.requester = (await import("@algolia/requester-fetch").then((lib) => lib.default || lib)).createFetchRequester();
      } else {
        nuxtApp.$algolia.transporter.requester = (await import("@algolia/requester-node-http").then((lib) => lib.default || lib)).createNodeHttpRequester();
      }
    }
    const searchResult = await algoliaIndex.search(query, requestOptions);
    result.value = searchResult;
    return searchResult;
  };
  return {
    result: computed(() => result.value),
    search
  };
}
