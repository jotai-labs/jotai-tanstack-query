import {
  QueryClient,
  QueryObserver,
  isCancelledError,
} from '@tanstack/query-core'
import type {
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  ResetOptions,
} from '@tanstack/query-core'
import { atom } from 'jotai'
import type { Getter, WritableAtom } from 'jotai'
import { atomWithDefault, atomWithObservable } from 'jotai/utils'
import { queryClientAtom } from './queryClientAtom'

export const buildCreateAtoms =
  <
    Options extends QueryObserverOptions<any, any, any, any, any>,
    Observer extends QueryObserver<any, any, any, any, any>,
    Result extends QueryObserverResult<any, any>
  >(
    createQueryObserver: (client: QueryClient, options: Options) => Observer
  ) =>
  (
    getOptions: (get: Getter) => Options,
    getQueryClient: (get: Getter) => QueryClient
  ) => {
    const observerCacheAtom = atom(() => new WeakMap<QueryClient, Observer>())

    const refreshAtom = atom(0)

    const observerAtom = atom((get) => {
      get(refreshAtom)
      const queryClient = getQueryClient(get)
      const options = getOptions(get)
      const observerCache = get(observerCacheAtom)
      let observer = observerCache.get(queryClient)
      if (observer) {
        observer.setOptions(options)
      } else {
        observer = createQueryObserver(queryClient, options)
        observerCache.set(queryClient, observer)
      }
      return observer
    })

    const resultAtom = atomWithDefault((get) => {
      const observer = get(observerAtom)
      return observer.getCurrentResult() as Result
    })

    const baseStatusAtom = atom(
      (get) => get(resultAtom),
      (get, set, returnUnsubscribe: (unsubscribe: () => void) => void) => {
        const observer = get(observerAtom)
        const unsubscribe = observer.subscribe((result) => {
          set(resultAtom, result as Result)
        })
        returnUnsubscribe(unsubscribe)
      }
    )
    baseStatusAtom.onMount = (initialize) => {
      let unsub: (() => void) | undefined
      initialize((unsubscribe) => {
        unsub = unsubscribe
      })
      return unsub
    }

    const statusAtom = atom(
      (get) => get(baseStatusAtom),
      (get, set, action: Action) => {
        if (action.type === 'refetch') {
          const observer = get(observerAtom)
          if (action.force) {
            observer.remove()
            const queryClient = getQueryClient(get)
            const observerCache = get(observerCacheAtom)
            observerCache.delete(queryClient)
            set(refreshAtom, (c) => c + 1)
            return
          }
          return observer.refetch(action.options).then(() => {})
        }
      }
    )

    const baseDataAtom = atomWithObservable((get) => {
      const observer = get(observerAtom)
      const observable = {
        subscribe: (
          arg: { next: (result: Result) => void } | ((result: Result) => void)
        ) => {
          const callback = (result: Result) => {
            if (
              result.isFetching ||
              (!result.isError && result.data === undefined) ||
              (result.isError && isCancelledError(result.error))
            ) {
              // do not update
              return
            }
            ;(typeof arg === 'function' ? arg : arg.next)(result)
          }
          const unsubscribe = observer.subscribe(
            callback as (result: unknown) => void
          )
          callback(observer.getCurrentResult() as Result)
          return { unsubscribe }
        },
      }
      return observable
    })

    const dataAtom = atom(
      (get) => {
        const baseData = get(baseDataAtom)
        if (baseData.error) {
          throw baseData.error
        }
        return baseData.data
      },
      (_get, set, action: Action) => set(statusAtom, action)
    )

    return [dataAtom, statusAtom] as const
  }

const createAtoms = buildCreateAtoms(
  (client, options) => new QueryObserver(client, options)
)

type Action = {
  type: 'refetch'
  force?: boolean
  options?: ResetOptions
}

export function atomsWithTanstackQuery<
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
  dataAtom: WritableAtom<TData, Action>,
  statusAtom: WritableAtom<QueryObserverResult<TData, TError>, Action>
] {
  return createAtoms(getOptions, getQueryClient)
}
