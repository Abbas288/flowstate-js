import { describe, expect, it } from 'vitest'
import { Transition } from '../src/Transition.js'

const validMove = { from: 'placed', to: 'paid', on: 'pay' }
const invalidNames = [undefined, null, '', '   ', 42, {}, ['idle']]

// Safe to share: a Transition exposes getters only, so no test can change it.
const payTransition = new Transition(validMove)

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

  it('is triggered by the event it was built with', () => {
    const transition = new Transition(validMove)

    expect(transition.isTriggeredBy('pay')).toBe(true)
  })

  it('is not triggered by any other event', () => {
    const transition = new Transition(validMove)

    expect(transition.isTriggeredBy('ship')).toBe(false)
  })

  it('tells events apart by case', () => {
    const transition = new Transition(validMove)

    expect(transition.isTriggeredBy('Pay')).toBe(false)
  })

  it('answers false instead of throwing exception when asked about a non-string', () => {
    const transition = new Transition(validMove)

    for (const invalidName of invalidNames) {
      expect(transition.isTriggeredBy(invalidName)).toBe(false)
    }
  })

  it('accepts a move without a guard', () => {
    expect(() => new Transition(validMove)).not.toThrow()
  })

  it('accepts a function as a guard', () => {
    const validGuard = (context) => context.amount > 0

    expect(() => new Transition({ ...validMove, guard: validGuard })).not.toThrow()
  })

  it('rejects a guard that is not a function', () => {
    const invalidGuards = ['always', 42, {}, null, true, ['guard']]

    for (const invalidGuard of invalidGuards) {
      expect(() => new Transition({ ...validMove, guard: invalidGuard }))
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
