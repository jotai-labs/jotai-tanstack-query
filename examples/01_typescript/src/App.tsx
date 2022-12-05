import React, { Suspense } from 'react'
import { atomsWithQuery } from 'jotai-tanstack-query'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'

const idAtom = atom(1)

const [userAtom] = atomsWithQuery((get) => ({
  queryKey: ['users', get(idAtom)],
  queryFn: async ({ queryKey: [, id] }) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
    return res.json()
  },
}))

const UserData = () => {
  const [data] = useAtom(userAtom)
  return <div>{JSON.stringify(data)}</div>
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

const App = () => (
  <>
    <Controls />
    <Suspense fallback="Loading...">
      <UserData />
    </Suspense>
  </>
)

export default App
