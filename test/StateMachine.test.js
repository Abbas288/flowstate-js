import { describe, expect, it } from 'vitest'
import { StateMachine } from '../src/StateMachine.js'

const invalidNames = [undefined, null, '', '   ', 42, {}, ['placed']]

describe('StateMachine', () => {
  it('starts in the state it was given', () => {
    const order = new StateMachine('placed')

    expect(order.currentStateName).toBe('placed')
  })

  it('rejects an initial state name that is not a non-empty string', () => {
    for (const invalidName of invalidNames) {
      expect(() => new StateMachine(invalidName)).toThrow(TypeError)
    }
  })

  it('says which name was wrong', () => {
    expect(() => new StateMachine('')).toThrow('Initial state name must be a non-empty string.')
  })

  it('does not let the current state be written from outside', () => {
    const order = new StateMachine('placed')

    expect(() => { order.currentStateName = 'shipped' }).toThrow(TypeError)
    expect(order.currentStateName).toBe('placed')
  })

  it('keeps machines independent of each other', () => {
    const order = new StateMachine('placed')
    const invoice = new StateMachine('draft')

    expect(order.currentStateName).toBe('placed')
    expect(invoice.currentStateName).toBe('draft')
  })

  it('accepts a starting state that is not defined yet', () => {
    expect(() => new StateMachine('never-defined')).not.toThrow()
  })
})
