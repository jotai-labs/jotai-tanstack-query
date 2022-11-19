import type {
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import { QueryClient, QueryObserver } from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai'
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
  ) => Omit<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
    'suspense'
  >,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): readonly [
  dataAtom: WritableAtom<TData, Action>,
  statusAtom: WritableAtom<QueryObserverResult<TData, TError>, Action>
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
        return observer.refetch(action.options).then(() => {})
      }
    }
  )
}
