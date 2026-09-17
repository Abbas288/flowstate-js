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
})

