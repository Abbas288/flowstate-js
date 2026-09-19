import { describe, expect, it } from 'vitest'
import { Transition } from '../src/Transition.js'

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

  it('rejects a from that is not a non-empty string', () => {
    const invalidNames = [undefined, null, '', '   ', 42, {}, ['placed']]

    for (const invalidName of invalidNames) {
      expect(() => new Transition({ from: invalidName, to: 'paid', on: 'pay' }))
        .toThrow(TypeError)
    }
  })

  it('rejects a to that is not a non-empty string', () => {
    const invalidNames = [undefined, null, '', '   ', 42, {}, ['paid']]

    for (const invalidName of invalidNames) {
      expect(() => new Transition({ from: 'placed', to: invalidName, on: 'pay' }))
        .toThrow(TypeError)
    }
  })

  it('rejects an on that is not a non-empty string', () => {
    const invalidNames = [undefined, null, '', '   ', 42, {}, ['pay']]

    for (const invalidName of invalidNames) {
      expect(() => new Transition({ from: 'placed', to: 'paid', on: invalidName }))
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
