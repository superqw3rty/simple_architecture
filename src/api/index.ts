// The public face of the API layer: endpoint functions, query factories and the cache.
// Import from '@/api'; http, config and createQueryClient stay internal.
export { ApiError } from './core/ApiError';
export { queryClient } from './core/queryClient';
export { fetchShowsPage, showQueries, type ShowsPageParams } from './shows';
