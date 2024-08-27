import type { RequestOptionsObject, SearchResponse } from '../../types';
import type { AsyncData } from '#app';
export type AsyncSearchParams = {
    query: string;
    indexName?: string;
    key?: string;
} & RequestOptionsObject;
export declare function useAsyncAlgoliaSearch({ query, requestOptions, indexName, key }: AsyncSearchParams): Promise<AsyncData<SearchResponse<unknown>, Error>>;
