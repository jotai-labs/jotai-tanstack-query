import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { useAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomsWithQuery } from '../src/index'

describe('issue #9', () => {
  it('status should change', async () => {
    const idAtom = atom(undefined as number | undefined)

    let resolve: (() => void) | undefined
    const [, statusAtom] = atomsWithQuery((get) => ({
      queryKey: ['users', get(idAtom)],
      queryFn: async ({ queryKey: [, id] }) => {
        await new Promise<void>((r) => {
          resolve = r
        })
        return { id }
      },
      // using as a dependent query
      enabled: Boolean(get(idAtom)),
    }))

    const DataFromStatusAtom = () => {
      const [status] = useAtom(statusAtom)
      const statusMessage = status.isInitialLoading
        ? 'initial loading'
        : status.status
      return (
        <div>
          <div>status: {statusMessage}</div>
          <div>data: {JSON.stringify(status.data)}</div>
        </div>
      )
    }

    const Controls = () => {
      const [id, setId] = useAtom(idAtom)
      return (
        <div>
          ID: {id}{' '}
          <button type="button" onClick={() => setId((c = 0) => c + 1)}>
            Next
          </button>
        </div>
      )
    }

    const App = () => (
      <>
        <Controls />
        <DataFromStatusAtom />
      </>
    )

    const { findByText, getByText } = render(<App />)

    await findByText('status: loading')

    fireEvent.click(getByText('Next'))
    await findByText('status: initial loading')
    resolve?.()
    await findByText('status: success')

    fireEvent.click(getByText('Next'))
    await findByText('status: initial loading')
    resolve?.()
    await findByText('status: success')
  })
})
