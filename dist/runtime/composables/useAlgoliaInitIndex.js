import { useAlgoliaRef } from "./useAlgoliaRef.js";
export function useAlgoliaInitIndex(indexName) {
  const algolia = useAlgoliaRef();
  const algoliaIndex = algolia?.initIndex(indexName);
  return algoliaIndex;
}
