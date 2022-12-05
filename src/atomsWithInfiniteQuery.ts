import { InfiniteQueryObserver, QueryClient } from '@tanstack/query-core'
import type {
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai/vanilla'
import { createAtoms } from './common'
import { queryClientAtom } from './queryClientAtom'

type Action =
  | {
      type: 'refetch'
      force?: boolean
      options?: Parameters<InfiniteQueryObserver['refetch']>[0]
    }
  | { type: 'fetchNextPage' }
  | { type: 'fetchPreviousPage' }

export function atomsWithInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  getOptions: (
    get: Getter
  ) => InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): readonly [
  dataAtom: WritableAtom<
    InfiniteData<TData> | Promise<InfiniteData<TData>>,
    [Action],
    void | Promise<QueryObserverResult<InfiniteData<TData>, TError>>
  >,
  statusAtom: WritableAtom<
    InfiniteQueryObserverResult<TData, TError>,
    [Action],
    void | Promise<QueryObserverResult<InfiniteData<TData>, TError>>
  >
] {
  return createAtoms(
    getOptions,
    getQueryClient,
    (client, options) => new InfiniteQueryObserver(client, options),
    (action, observer, refresh) => {
      if (action.type === 'refetch') {
        if (action.force) {
          observer.remove()
          refresh()
          return
        }
        return observer.refetch(action.options)
      }
      if (action.type === 'fetchNextPage') {
        return observer.fetchNextPage()
      }
      if (action.type === 'fetchPreviousPage') {
        return observer.fetchPreviousPage()
      }
    }
  )
}
