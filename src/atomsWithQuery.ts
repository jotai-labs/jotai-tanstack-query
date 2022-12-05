import { QueryClient, QueryObserver } from '@tanstack/query-core'
import type {
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai/vanilla'
import { createAtoms } from './common'
import { queryClientAtom } from './queryClientAtom'

type Action = {
  type: 'refetch'
  force?: boolean
  options?: Parameters<QueryObserver['refetch']>[0]
}

export function atomsWithQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  getOptions: (
    get: Getter
  ) => QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): readonly [
  dataAtom: WritableAtom<
    TData | Promise<TData>,
    [Action],
    void | Promise<QueryObserverResult<TData, TError>>
  >,
  statusAtom: WritableAtom<
    QueryObserverResult<TData, TError>,
    [Action],
    void | Promise<QueryObserverResult<TData, TError>>
  >
] {
  return createAtoms(
    getOptions,
    getQueryClient,
    (client, options) => new QueryObserver(client, options),
    (action, observer, refresh) => {
      if (action.type === 'refetch') {
        if (action.force) {
          observer.remove()
          refresh()
          return
        }
        return observer.refetch(action.options)
      }
    }
  )
}
