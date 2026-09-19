import { describe, expect, it } from 'vitest'
import { Transition } from '../src/Transition.js'

const validMove = { from: 'placed', to: 'paid', on: 'pay' }
const invalidNames = [undefined, null, '', '   ', 42, {}, ['idle']]

describe('Transition', () => {
  it('exposes the move it was given', () => {
    const transition = new Transition({ from: 'placed', to: 'paid', on: 'pay' })

    expect(transition.fromStateName).toBe('placed')
    expect(transition.toStateName).toBe('paid')
    expect(transition.eventName).toBe('pay')
  })

  it('allows a move that returns to the same state', () => {
    const transition = new Transition({ from: 'paid', to: 'paid', on: 'confirm' })

    expect(transition.fromStateName).toBe(transition.toStateName)
  })

  it.each(['from', 'to', 'on'])('rejects %s unless it is a non-empty string', (field) => {
    for (const invalidName of invalidNames) {
      expect(() => new Transition({ ...validMove, [field]: invalidName }))
        .toThrow(TypeError)
    }
  })

  it('rejects being built without a move at all', () => {
    expect(() => new Transition()).toThrow(TypeError)
  })

  it('names the missing part in the error message', () => {
    expect(() => new Transition({ from: 'placed', to: 'paid' }))
      .toThrow('Transition on must be a non-empty string.')
  })
})
