import type { SearchForFacetValuesResponse } from '@algolia/client-search';
import type { ComputedRef } from 'vue';
import { AlgoliaIndices, RequestOptionsObject } from '../../types.js';
export type SearchForFacetValuesParams = {
    facet: {
        name: string;
        query: string;
    };
} & RequestOptionsObject;
export type UseSearchForFacetValuesReturnType = {
    result: ComputedRef<SearchForFacetValuesResponse>;
    search: (params: SearchForFacetValuesParams) => Promise<SearchForFacetValuesResponse>;
};
export declare function useAlgoliaFacetedSearch<K extends keyof AlgoliaIndices>(indexName: K): UseSearchForFacetValuesReturnType;
export declare function useAlgoliaFacetedSearch(indexName: string): UseSearchForFacetValuesReturnType;
