import { describe, expect, it } from 'vitest'
import { State } from '../src/State.js'

describe('State', () => {
  it('exposes the name it was given', () => {
    const state = new State('idle')

    expect(state.name).toBe('idle')
  })

  it('rejects a name that is not a non-empty string', () => {
    const invalidNames = [undefined, null, '', '   ', 42, {}, ['idle']]

    for (const invalidName of invalidNames) {
      expect(() => new State(invalidName)).toThrow(TypeError)
    }
  })

  it('runs its onEnter hook with the shared context', () => {
    const context = { visits: 0 }
    const state = new State('paid', {
      onEnter: (ctx) => { ctx.visits += 1 }
    })

    state.enter(context)

    expect(context.visits).toBe(1)
  })

  it('does nothing when entered without an onEnter hook', () => {
    const state = new State('idle')

    expect(() => state.enter({})).not.toThrow()
  })

  it('rejects an onEnter that is not a function', () => {
    const invalidHooks = ['not-a-function', 42, {}, null]

    for (const invalidHook of invalidHooks) {
      expect(() => new State('x', { onEnter: invalidHook })).toThrow(TypeError)
    }
  })
})

