import { describe, expect, it } from 'vitest'
import {
  DuplicateStateError,
  FlowStateError,
  NoTransitionError,
  UnknownStateError,
} from '../src/errors.js'

const stateErrors = [
  ['UnknownStateError', UnknownStateError],
  ['DuplicateStateError', DuplicateStateError],
]

describe('FlowStateError', () => {
  it('is a normal Error, so it can be thrown and caught like one', () => {
    const error = new FlowStateError('something broke')

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('something broke')
  })

  it('is named after its own class', () => {
    expect(new FlowStateError('x').name).toBe('FlowStateError')
  })

  it('carries a stack trace', () => {
    expect(new FlowStateError('x').stack).toContain('FlowStateError')
  })
})

describe.each(stateErrors)('%s', (className, StateError) => {
  it('can be caught as a FlowStateError', () => {
    expect(new StateError('paid')).toBeInstanceOf(FlowStateError)
  })

  it('can be caught as a plain Error', () => {
    expect(new StateError('paid')).toBeInstanceOf(Error)
  })

  it('is named after its own class, not after the base class', () => {
    expect(new StateError('paid').name).toBe(className)
  })

  it('names the state in its message', () => {
    expect(new StateError('paid').message).toContain('paid')
  })

  it('hands out the state name without parsing the message', () => {
    expect(new StateError('paid').stateName).toBe('paid')
  })

  it('does not let the state name be written from outside', () => {
    const error = new StateError('paid')

    expect(() => { error.stateName = 'shipped' }).toThrow(TypeError)
    expect(error.stateName).toBe('paid')
  })
})

describe('NoTransitionError', () => {
  it('can be caught as a FlowStateError', () => {
    expect(new NoTransitionError('placed', 'ship')).toBeInstanceOf(FlowStateError)
  })

  it('is named after its own class, not after the base class', () => {
    expect(new NoTransitionError('placed', 'ship').name).toBe('NoTransitionError')
  })

  it('names both the state and the event in its message', () => {
    const error = new NoTransitionError('placed', 'ship')

    expect(error.message).toContain('placed')
    expect(error.message).toContain('ship')
  })

  it('hands out both names without parsing the message', () => {
    const error = new NoTransitionError('placed', 'ship')

    expect(error.fromStateName).toBe('placed')
    expect(error.eventName).toBe('ship')
  })

  it('does not let either name be written from outside', () => {
    const error = new NoTransitionError('placed', 'ship')

    expect(() => { error.fromStateName = 'paid' }).toThrow(TypeError)
    expect(() => { error.eventName = 'pay' }).toThrow(TypeError)
    expect(error.fromStateName).toBe('placed')
    expect(error.eventName).toBe('ship')
  })

  it('is not one of the errors about a single state name', () => {
    const error = new NoTransitionError('placed', 'ship')

    expect(error).not.toBeInstanceOf(UnknownStateError)
    expect(error).not.toBeInstanceOf(DuplicateStateError)
  })

  it('offers no stateName, since two names are in play', () => {
    expect(new NoTransitionError('placed', 'ship').stateName).toBeUndefined()
  })
})

describe('the error family', () => {
  it('lets one catch handle every kind the module throws', () => {
    const thrown = [
      new UnknownStateError('paid'),
      new DuplicateStateError('paid'),
      new NoTransitionError('placed', 'ship'),
    ]

    for (const error of thrown) {
      expect(error).toBeInstanceOf(FlowStateError)
    }
  })

  it('keeps the two kinds apart', () => {
    expect(new UnknownStateError('paid')).not.toBeInstanceOf(DuplicateStateError)
    expect(new DuplicateStateError('paid')).not.toBeInstanceOf(UnknownStateError)
  })

  it('says different things about the same state name', () => {
    const unknownStateMessage = new UnknownStateError('paid').message
    const duplicateStateMessage = new DuplicateStateError('paid').message

    expect(unknownStateMessage).not.toBe(duplicateStateMessage)
  })
})
