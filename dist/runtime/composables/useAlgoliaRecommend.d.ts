import { RecommendationsQuery } from '@algolia/recommend';
import { ComputedRef } from 'vue';
import { RequestOptionsObject, SearchResponse } from '../../types.js';
export type RecommendParams = {
    queries: RecommendationsQuery[];
} & RequestOptionsObject;
export type MultipleQueriesResponse<T> = {
    results: Array<SearchResponse<T>>;
};
export type UseAlgoliaRecommend<T> = {
    result: ComputedRef<MultipleQueriesResponse<T>>;
    get: (params: RecommendParams) => Promise<MultipleQueriesResponse<T>>;
};
export declare function useAlgoliaRecommend<T>(key?: string): UseAlgoliaRecommend<T>;
