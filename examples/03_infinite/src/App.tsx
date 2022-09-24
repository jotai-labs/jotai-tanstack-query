import React, { Suspense } from 'react'
import { useAtom } from 'jotai'
import { atomsWithTanstackInfiniteQuery } from 'jotai-tanstack-query'

const [postsAtom] = atomsWithTanstackInfiniteQuery(() => ({
  queryKey: ['posts'],
  queryFn: async ({ pageParam = 1 }) => {
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${pageParam}`
    )
    const data: { id: number; title: string } = await res.json()
    return data
  },
  getNextPageParam: (lastPage) => lastPage.id + 1,
}))

const Posts = () => {
  const [data, dispatch] = useAtom(postsAtom)
  return (
    <div>
      <button onClick={() => dispatch({ type: 'fetchNextPage' })}>Next</button>
      <ul>
        {data.pages.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  )
}

const App = () => (
  <>
    <Suspense fallback="Loading...">
      <Posts />
    </Suspense>
  </>
)

export default App
