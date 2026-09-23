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

  it('knows about no states before any are defined', () => {
    const order = new StateMachine('placed')

    expect(order.stateNames).toEqual([])
  })

  it('lists the states it has been told about, in definition order', () => {
    const order = new StateMachine('placed')

    order.defineState('placed')
    order.defineState('paid')
    order.defineState('shipped')

    expect(order.stateNames).toEqual(['placed', 'paid', 'shipped'])
  })

  it('hands back the machine so definitions can be chained', () => {
    const order = new StateMachine('placed')

    order
      .defineState('placed')
      .defineState('paid')

    expect(order.stateNames).toEqual(['placed', 'paid'])
  })

  it('passes a bad state name straight on as a TypeError', () => {
    const order = new StateMachine('placed')

    for (const invalidName of invalidNames) {
      expect(() => order.defineState(invalidName)).toThrow(TypeError)
    }
  })

  it('passes a bad hook straight on as a TypeError', () => {
    const order = new StateMachine('placed')

    expect(() => order.defineState('paid', { onEnter: 'not-a-function' }))
      .toThrow(TypeError)
  })

  it('accepts a state without any hooks', () => {
    const order = new StateMachine('placed')

    expect(() => order.defineState('paid')).not.toThrow()
  })

  it('cannot be changed through the list of names it returns', () => {
    const order = new StateMachine('placed')
    order.defineState('placed')

    order.stateNames.push('forged')

    expect(order.stateNames).toEqual(['placed'])
  })

  it('keeps the current state untouched when states are defined', () => {
    const order = new StateMachine('placed')

    order.defineState('paid')

    expect(order.currentStateName).toBe('placed')
  })
})
