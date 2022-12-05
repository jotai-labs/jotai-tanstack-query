import { MutationObserver, QueryClient } from '@tanstack/query-core'
import type {
  MutateOptions,
  MutationObserverOptions,
  MutationObserverResult,
} from '@tanstack/query-core'
import type { Getter, WritableAtom } from 'jotai/vanilla'
import { createAtoms } from './common'
import { queryClientAtom } from './queryClientAtom'

type Action<TData, TError, TVariables, TContext> = [
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>
]

export function atomsWithMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  getOptions: (
    get: Getter
  ) => MutationObserverOptions<TData, TError, TVariables, TContext>,
  getQueryClient: (get: Getter) => QueryClient = (get) => get(queryClientAtom)
): readonly [
  dataAtom: WritableAtom<
    TData | Promise<TData>,
    [Action<TData, TError, TVariables, TContext>],
    Promise<TData>
  >,
  statusAtom: WritableAtom<
    MutationObserverResult<TData, TError, TVariables, TContext>,
    [Action<TData, TError, TVariables, TContext>],
    Promise<TData>
  >
] {
  return createAtoms(
    getOptions,
    getQueryClient,
    (client, options) => new MutationObserver(client, options),
    (action, observer) => observer.mutate(...action)
  )
}
