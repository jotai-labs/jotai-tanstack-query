import React, { Suspense } from 'react'
import { atomsWithQuery } from 'jotai-tanstack-query'
import { useAtom, useSetAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { ErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'

const idAtom = atom(1)

const [userAtom] = atomsWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://reqres.in/api/users/${id}`)
    return res.json()
  },
}))

const UserData = () => {
  const [{ data }, dispatch] = useAtom(userAtom)
  return (
    <div>
      <ul>
        <li>ID: {data.id}</li>
        <li>First Name: {data.first_name}</li>
        <li>Last Name: {data.last_name}</li>
      </ul>
      <button onClick={() => dispatch({ type: 'refetch' })}>refetch</button>
    </div>
  )
}

const Controls = () => {
  const [id, setId] = useAtom(idAtom)
  return (
    <div>
      ID: {id}{' '}
      <button type="button" onClick={() => setId((c) => c - 1)}>
        Prev
      </button>{' '}
      <button type="button" onClick={() => setId((c) => c + 1)}>
        Next
      </button>
    </div>
  )
}

const Fallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const setId = useSetAtom(idAtom)
  const dispatch = useSetAtom(userAtom)
  const retry = () => {
    setId(1)
    dispatch({ type: 'refetch', force: true })
    resetErrorBoundary()
  }
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button type="button" onClick={retry}>
        Try again
      </button>
    </div>
  )
}

const App = () => (
  <ErrorBoundary FallbackComponent={Fallback}>
    <Suspense fallback="Loading...">
      <Controls />
      <UserData />
    </Suspense>
  </ErrorBoundary>
)

export default App
