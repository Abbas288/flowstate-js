import { describe, expect, it } from 'vitest'
import { HistoryEntry } from '../src/HistoryEntry.js'
import { Transition } from '../src/Transition.js'

describe('HistoryEntry', () => {
  it('records the state the machine left, the state it entered and the event that was sent', () => {
    const entry = new HistoryEntry(new Transition({ from: 'placed', to: 'paid', on: 'pay' }))

    expect(entry.fromStateName).toBe('placed')
    expect(entry.toStateName).toBe('paid')
    expect(entry.eventName).toBe('pay')
  })

  it('rejects values that are not transitions', () => {
    const nonTransitions = [
      undefined,
      null,
      'pay',
      42,
      { from: 'placed', to: 'paid', on: 'pay' },
      { fromStateName: 'placed', toStateName: 'paid', eventName: 'pay' },
    ]

    for (const nonTransition of nonTransitions) {
      expect(() => new HistoryEntry(nonTransition)).toThrow(TypeError)
    }
  })

  it.each(['fromStateName', 'toStateName', 'eventName'])('throws a TypeError instead of changing its %s', (field) => {
    const entry = new HistoryEntry(new Transition({ from: 'placed', to: 'paid', on: 'pay' }))
    const recordedName = entry[field]

    expect(() => {
      entry[field] = 'shipped'
    }).toThrow(TypeError)
    expect(entry[field]).toBe(recordedName)
  })
})
