import { QueryClient } from '@tanstack/query-core'
import { atom } from 'jotai/vanilla'

export const queryClientAtom = atom(new QueryClient())
