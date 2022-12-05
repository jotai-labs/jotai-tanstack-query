import React, { Component, StrictMode, Suspense, useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClient } from '@tanstack/query-core'
import { fireEvent, render } from '@testing-library/react'
import { useAtom, useSetAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomsWithQuery } from '../src/index'

beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(() => {
  jest.runAllTimers()
  jest.useRealTimers()
})

it('query basic test', async () => {
  let resolve = () => {}
  const [countAtom] = atomsWithQuery(() => ({
    queryKey: ['count1'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: 0 } }
    },
  }))
  const Counter = () => {
    const [
      {
        response: { count },
      },
    ] = useAtom(countAtom)
    return (
      <>
        <div>count: {count}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')
})

it('query basic test with object instead of function', async () => {
  let resolve = () => {}
  const [countAtom] = atomsWithQuery(() => ({
    queryKey: ['count2'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: 0 } }
    },
  }))
  const Counter = () => {
    const [
      {
        response: { count },
      },
    ] = useAtom(countAtom)
    return (
      <>
        <div>count: {count}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')
})

it('query refetch', async () => {
  let count = 0
  const mockFetch = jest.fn((response) => ({ response }))
  let resolve = () => {}
  const [countAtom] = atomsWithQuery(() => ({
    queryKey: ['count3'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      const response = mockFetch({ count })
      ++count
      return response
    },
  }))
  const Counter = () => {
    const [
      {
        response: { count },
      },
      dispatch,
    ] = useAtom(countAtom)
    return (
      <>
        <div>count: {count}</div>
        <button onClick={() => dispatch({ type: 'refetch', force: true })}>
          refetch
        </button>
      </>
    )
  }

  const { findByText, getByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')
  expect(mockFetch).toBeCalledTimes(1)

  fireEvent.click(getByText('refetch'))
  await findByText('loading')
  resolve()
  await findByText('count: 1')
  expect(mockFetch).toBeCalledTimes(2)
})

it('query loading', async () => {
  let count = 0
  const mockFetch = jest.fn((response) => ({ response }))
  let resolve = () => {}
  const [countAtom] = atomsWithQuery(() => ({
    queryKey: ['count4'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      const response = mockFetch({ count })
      ++count
      return response
    },
  }))
  const derivedAtom = atom((get) => get(countAtom))
  const dispatchAtom = atom(null, (_get, set, action: any) => {
    set(countAtom, action)
  })
  const Counter = () => {
    const [
      {
        response: { count },
      },
    ] = useAtom(derivedAtom)
    return (
      <>
        <div>count: {count}</div>
      </>
    )
  }
  const RefreshButton = () => {
    const [, dispatch] = useAtom(dispatchAtom)
    return (
      <button onClick={() => dispatch({ type: 'refetch', force: true })}>
        refetch
      </button>
    )
  }

  const { findByText, getByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
      <RefreshButton />
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')

  fireEvent.click(getByText('refetch'))
  await findByText('loading')
  resolve()
  await findByText('count: 1')

  fireEvent.click(getByText('refetch'))
  await findByText('loading')
  resolve()
  await findByText('count: 2')
})

it('query loading 2', async () => {
  let count = 0
  const mockFetch = jest.fn((response) => ({ response }))
  let resolve = () => {}
  const [countAtom] = atomsWithQuery(() => ({
    queryKey: ['count5'],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      const response = mockFetch({ count })
      ++count
      return response
    },
  }))

  const Counter = () => {
    const [
      {
        response: { count },
      },
      dispatch,
    ] = useAtom(countAtom)
    return (
      <>
        <div>count: {count}</div>
        <button onClick={() => dispatch({ type: 'refetch', force: true })}>
          refetch
        </button>
      </>
    )
  }
  const { findByText, getByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')

  fireEvent.click(getByText('refetch'))
  await findByText('loading')
  resolve()
  await findByText('count: 1')

  fireEvent.click(getByText('refetch'))
  await findByText('loading')
  resolve()
  await findByText('count: 2')
})

it('query no-loading with keepPreviousData', async () => {
  const dataAtom = atom(0)
  const mockFetch = jest.fn((response) => ({ response }))
  let resolve = () => {}
  const [countAtom] = atomsWithQuery((get) => ({
    queryKey: ['keepPreviousData', get(dataAtom)],
    keepPreviousData: true,
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      const response = mockFetch({ count: get(dataAtom) })
      return response
    },
  }))
  const Counter = () => {
    const [
      {
        response: { count },
      },
    ] = useAtom(countAtom)
    return (
      <>
        <div>count: {count}</div>
      </>
    )
  }
  const RefreshButton = () => {
    const [data, setData] = useAtom(dataAtom)
    return <button onClick={() => setData(data + 1)}>refetch</button>
  }

  const { findByText, getByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
      <RefreshButton />
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')

  fireEvent.click(getByText('refetch'))
  await expect(() => findByText('loading')).rejects.toThrow()
  resolve()
  await findByText('count: 1')

  fireEvent.click(getByText('refetch'))
  await expect(() => findByText('loading')).rejects.toThrow()
  resolve()
  await findByText('count: 2')
})

it('query with enabled', async () => {
  const slugAtom = atom<string | null>(null)
  const mockFetch = jest.fn((response) => ({ response }))
  let resolve = () => {}
  const [, slugQueryAtom] = atomsWithQuery((get) => {
    const slug = get(slugAtom)
    return {
      enabled: !!slug,
      queryKey: ['disabled_until_value', slug],
      queryFn: async () => {
        await new Promise<void>((r) => (resolve = r))
        return mockFetch({ slug: `hello-${slug}` })
      },
    }
  })

  const Slug = () => {
    const [{ data }] = useAtom(slugQueryAtom)
    if (!data?.response?.slug) return <div>not enabled</div>
    return <div>slug: {data?.response?.slug}</div>
  }

  const Parent = () => {
    const [, setSlug] = useAtom(slugAtom)
    return (
      <div>
        <button
          onClick={() => {
            setSlug('world')
          }}>
          set slug
        </button>
        <Slug />
      </div>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Parent />
      </Suspense>
    </StrictMode>
  )

  await findByText('not enabled')
  expect(mockFetch).toHaveBeenCalledTimes(0)

  fireEvent.click(getByText('set slug'))
  // await findByText('loading')
  resolve()
  await findByText('slug: hello-world')
  expect(mockFetch).toHaveBeenCalledTimes(1)
})

it('query with enabled 2', async () => {
  const mockFetch = jest.fn((response) => ({ response }))
  const enabledAtom = atom<boolean>(true)
  const slugAtom = atom<string | null>('first')

  const [, slugQueryAtom] = atomsWithQuery((get) => {
    const slug = get(slugAtom)
    const isEnabled = get(enabledAtom)
    return {
      enabled: isEnabled,
      queryKey: ['enabled_toggle'],
      queryFn: async () => {
        await new Promise<void>((r) => setTimeout(r, 10 * 1000))
        return mockFetch({ slug: `hello-${slug}` })
      },
    }
  })

  const Slug = () => {
    const [{ data }] = useAtom(slugQueryAtom)
    if (!data?.response?.slug) return <div>not enabled</div>
    return <div>slug: {data?.response?.slug}</div>
  }

  const Parent = () => {
    const [, setSlug] = useAtom(slugAtom)
    const [, setEnabled] = useAtom(enabledAtom)
    return (
      <div>
        <button
          onClick={() => {
            setSlug('world')
          }}>
          set slug
        </button>
        <button
          onClick={() => {
            setEnabled(true)
          }}>
          set enabled
        </button>
        <button
          onClick={() => {
            setEnabled(false)
          }}>
          set disabled
        </button>
        <Slug />
      </div>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Parent />
      </Suspense>
    </StrictMode>
  )

  jest.runOnlyPendingTimers()
  await findByText('slug: hello-first')
  expect(mockFetch).toHaveBeenCalledTimes(1)

  fireEvent.click(getByText('set disabled'))
  fireEvent.click(getByText('set slug'))

  await findByText('slug: hello-first')
  expect(mockFetch).toHaveBeenCalledTimes(1)

  fireEvent.click(getByText('set enabled'))
  jest.runOnlyPendingTimers()
  await findByText('slug: hello-world')
  expect(mockFetch).toHaveBeenCalledTimes(2)
})

it('query with enabled (#500)', async () => {
  const enabledAtom = atom(true)
  let resolve = () => {}
  const [countAtom] = atomsWithQuery((get) => {
    const enabled = get(enabledAtom)
    return {
      enabled,
      queryKey: ['count_500_issue'],
      queryFn: async () => {
        await new Promise<void>((r) => (resolve = r))
        return { response: { count: 1 } }
      },
    }
  })

  const Counter = () => {
    const [value] = useAtom(countAtom)
    if (!value) return null
    const {
      response: { count },
    } = value
    return <div>count: {count}</div>
  }

  const Parent = () => {
    const [showChildren, setShowChildren] = useState(true)
    const [, setEnabled] = useAtom(enabledAtom)
    return (
      <div>
        <button
          onClick={() => {
            setShowChildren((x) => !x)
            setEnabled((x) => !x)
          }}>
          toggle
        </button>
        {showChildren ? <Counter /> : <div>hidden</div>}
      </div>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Parent />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 1')

  fireEvent.click(getByText('toggle'))
  resolve()
  await findByText('hidden')

  fireEvent.click(getByText('toggle'))
  resolve()
  await findByText('count: 1')
})

it('query with initialData test', async () => {
  const mockFetch = jest.fn((response) => ({ response }))

  const [countAtom] = atomsWithQuery(() => ({
    queryKey: ['initialData_count1'],
    queryFn: async () => {
      return mockFetch({ count: 10 })
    },
    initialData: { response: { count: 0 } },
  }))
  const Counter = () => {
    const [
      {
        response: { count },
      },
    ] = useAtom(countAtom)
    return (
      <>
        <div>count: {count}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Counter />
    </StrictMode>
  )

  // NOTE: the atom never suspends
  await findByText('count: 0')
  await findByText('count: 10')
  expect(mockFetch).toHaveBeenCalledTimes(1)
})

it('query dependency test', async () => {
  const baseCountAtom = atom(0)
  const incrementAtom = atom(null, (_get, set) =>
    set(baseCountAtom, (c) => c + 1)
  )
  let resolve = () => {}
  const [countAtom] = atomsWithQuery((get) => ({
    queryKey: ['count_with_dependency', get(baseCountAtom)],
    queryFn: async () => {
      await new Promise<void>((r) => (resolve = r))
      return { response: { count: get(baseCountAtom) } }
    },
  }))

  const Counter = () => {
    const [
      {
        response: { count },
      },
    ] = useAtom(countAtom)
    return (
      <>
        <div>count: {count}</div>
      </>
    )
  }

  const Controls = () => {
    const [, increment] = useAtom(incrementAtom)
    return <button onClick={increment}>increment</button>
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
      <Controls />
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')

  fireEvent.click(getByText('increment'))
  await findByText('loading')
  resolve()
  await findByText('count: 1')
})

describe('error handling', () => {
  class ErrorBoundary extends Component<
    { message?: string; retry?: () => void; children: ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { message?: string; children: ReactNode }) {
      super(props)
      this.state = { hasError: false }
    }
    static getDerivedStateFromError() {
      return { hasError: true }
    }
    render() {
      return this.state.hasError ? (
        <div>
          {this.props.message || 'errored'}
          {this.props.retry && (
            <button
              onClick={() => {
                this.props.retry?.()
                this.setState({ hasError: false })
              }}>
              retry
            </button>
          )}
        </div>
      ) : (
        this.props.children
      )
    }
  }

  it('can catch error in error boundary', async () => {
    let resolve = () => {}
    const [countAtom] = atomsWithQuery(() => ({
      queryKey: ['error test', 'count1'],
      retry: false,
      queryFn: async (): Promise<{ response: { count: number } }> => {
        await new Promise<void>((r) => (resolve = r))
        throw new Error('fetch error')
      },
    }))
    const Counter = () => {
      const [
        {
          response: { count },
        },
      ] = useAtom(countAtom)
      return (
        <>
          <div>count: {count}</div>
        </>
      )
    }

    const { findByText } = render(
      <StrictMode>
        <ErrorBoundary>
          <Suspense fallback="loading">
            <Counter />
          </Suspense>
        </ErrorBoundary>
      </StrictMode>
    )

    await findByText('loading')
    resolve()
    await findByText('errored')
  })

  it('can recover from error', async () => {
    let count = -1
    let willThrowError = false
    let resolve = () => {}
    const [countAtom] = atomsWithQuery(() => ({
      queryKey: ['error test', 'count2'],
      retry: false,
      queryFn: async () => {
        willThrowError = !willThrowError
        ++count
        await new Promise<void>((r) => (resolve = r))
        if (willThrowError) {
          throw new Error('fetch error')
        }
        return { response: { count } }
      },
    }))
    const Counter = () => {
      const [
        {
          response: { count },
        },
        dispatch,
      ] = useAtom(countAtom)
      const refetch = () => dispatch({ type: 'refetch', force: true })
      return (
        <>
          <div>count: {count}</div>
          <button onClick={refetch}>refetch</button>
        </>
      )
    }

    const App = () => {
      const dispatch = useSetAtom(countAtom)
      const retry = () => {
        dispatch({ type: 'refetch', force: true })
      }
      return (
        <ErrorBoundary retry={retry}>
          <Suspense fallback="loading">
            <Counter />
          </Suspense>
        </ErrorBoundary>
      )
    }

    const { findByText, getByText } = render(
      <>
        <App />
      </>
    )

    await findByText('loading')
    resolve()
    await findByText('errored')

    fireEvent.click(getByText('retry'))
    await findByText('loading')
    resolve()
    await findByText('count: 1')

    fireEvent.click(getByText('refetch'))
    await findByText('loading')
    resolve()
    await findByText('errored')

    fireEvent.click(getByText('retry'))
    await findByText('loading')
    resolve()
    await findByText('count: 3')
  })
})

it('query expected QueryCache test', async () => {
  const queryClient = new QueryClient()
  let resolve = () => {}
  const [countAtom] = atomsWithQuery(
    () => ({
      queryKey: ['count6'],
      queryFn: async () => {
        await new Promise<void>((r) => (resolve = r))
        return { response: { count: 0 } }
      },
    }),
    () => queryClient
  )
  const Counter = () => {
    const [
      {
        response: { count },
      },
    ] = useAtom(countAtom)

    return (
      <>
        <div>count: {count}</div>
      </>
    )
  }

  const { findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  resolve()
  await findByText('count: 0')
  expect(queryClient.getQueryCache().getAll().length).toBe(1)
})
