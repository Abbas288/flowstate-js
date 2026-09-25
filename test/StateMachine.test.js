import { describe, expect, it } from 'vitest'
import { StateMachine } from '../src/StateMachine.js'
import { DuplicateStateError, FlowStateError } from '../src/errors.js'

const invalidNames = [undefined, null, '', '   ', 42, {}, ['placed']]
const invalidFunctions = ['always', 42, {}, null, true, ['guard']]
const validMove = { from: 'placed', to: 'paid', on: 'pay' }

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

  it('refuses to define the same state name twice', () => {
    const order = new StateMachine('placed')

    order.defineState('paid')

    expect(() => order.defineState('paid')).toThrow(DuplicateStateError)
  })

  it('refuses a name that is taken even when the hooks differ', () => {
    const order = new StateMachine('placed')

    order.defineState('paid', { onEnter: () => {} })

    expect(() => order.defineState('paid', { onExit: () => {} }))
      .toThrow(DuplicateStateError)
  })

  it('treats a taken name as a broken machine rule, not as a bad argument', () => {
    const order = new StateMachine('placed')

    order.defineState('paid')

    expect(() => order.defineState('paid')).toThrow(FlowStateError)
    expect(() => order.defineState('paid')).not.toThrow(TypeError)
  })

  it('does not list a name twice when it refuses a duplicate', () => {
    const order = new StateMachine('placed')

    order.defineState('paid')
    expect(() => order.defineState('paid')).toThrow(DuplicateStateError)

    expect(order.stateNames).toEqual(['paid'])
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

  it('sees no way out of a state before any transition is defined', () => {
    const order = new StateMachine('placed')

    expect(order.eventNamesFrom('placed')).toEqual([])
  })

  it('lists the events that lead out of a state, in definition order', () => {
    const order = new StateMachine('placed')

    order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
    order.defineTransition({ from: 'placed', to: 'void', on: 'cancel' })

    expect(order.eventNamesFrom('placed')).toEqual(['pay', 'cancel'])
  })

  it('lists only events that leave the state it was asked about', () => {
    const order = new StateMachine('placed')

    order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
    order.defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })

    expect(order.eventNamesFrom('placed')).toEqual(['pay'])
  })

  it('sees no way out of a state nobody mentioned', () => {
    const order = new StateMachine('placed')

    order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

    expect(order.eventNamesFrom('shipped')).toEqual([])
  })

  it('hands back the machine so transitions can be chained', () => {
    const order = new StateMachine('placed')

    order
      .defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      .defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })

    expect(order.eventNamesFrom('paid')).toEqual(['ship'])
  })

  it('accepts a transition with a guard', () => {
    const order = new StateMachine('placed')

    order.defineTransition({
      from: 'placed',
      to: 'paid',
      on: 'pay',
      guard: (context) => context.amount > 0,
    })

    expect(order.eventNamesFrom('placed')).toEqual(['pay'])
  })

  it('lists a guarded event even though the guard refuses', () => {
    const order = new StateMachine('placed')

    order.defineTransition({ from: 'placed', to: 'paid', on: 'pay', guard: () => false })

    expect(order.eventNamesFrom('placed')).toEqual(['pay'])
  })

  it.each(['from', 'to', 'on'])('throws a TypeError when %s is not a non-empty string', (field) => {
    const order = new StateMachine('placed')

    for (const invalidName of invalidNames) {
      expect(() => order.defineTransition({ ...validMove, [field]: invalidName }))
        .toThrow(TypeError)
    }
  })

  it('throws a TypeError when the guard is not a function', () => {
    const order = new StateMachine('placed')

    for (const invalidGuard of invalidFunctions) {
      expect(() => order.defineTransition({ ...validMove, guard: invalidGuard }))
        .toThrow(TypeError)
    }
  })

  it('throws a TypeError when no move is given at all', () => {
    const order = new StateMachine('placed')

    expect(() => order.defineTransition()).toThrow(TypeError)
  })

  it('accepts a transition between states that are not defined yet', () => {
    const order = new StateMachine('placed')

    expect(() => order.defineTransition({ from: 'packed', to: 'shipped', on: 'dispatch' }))
      .not.toThrow()
  })

  it('cannot be changed through the list of events it returns', () => {
    const order = new StateMachine('placed')
    order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

    order.eventNamesFrom('placed').push('forged')

    expect(order.eventNamesFrom('placed')).toEqual(['pay'])
  })
})
