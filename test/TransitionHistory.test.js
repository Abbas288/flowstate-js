import { describe, expect, it } from 'vitest'
import { HistoryEntry } from '../src/HistoryEntry.js'
import { Transition } from '../src/Transition.js'
import { TransitionHistory } from '../src/TransitionHistory.js'
import { expectSameItems } from './expectSameItems.js'

const payMove = { from: 'placed', to: 'paid', on: 'pay' }
const shipMove = { from: 'paid', to: 'shipped', on: 'ship' }

describe('TransitionHistory', () => {
  it('lists no entries while empty', () => {
    const history = new TransitionHistory()

    expect(history.entries).toEqual([])
  })

  it('lists the very entries that were recorded, oldest first', () => {
    const history = new TransitionHistory()
    const paying = new HistoryEntry(new Transition(payMove))
    const shipping = new HistoryEntry(new Transition(shipMove))

    history.record(paying)
    history.record(shipping)

    expectSameItems(history.entries, [paying, shipping])
  })

  it('keeps histories independent of each other', () => {
    const orders = new TransitionHistory()
    const invoices = new TransitionHistory()

    orders.record(new HistoryEntry(new Transition(payMove)))

    expect(invoices.entries).toEqual([])
  })

  it('cannot be changed through the list of entries it returns', () => {
    const history = new TransitionHistory()
    const paying = new HistoryEntry(new Transition(payMove))
    history.record(paying)

    history.entries.push(new HistoryEntry(new Transition(shipMove)))

    expectSameItems(history.entries, [paying])
  })

  it('rejects values that are not history entries', () => {
    const history = new TransitionHistory()
    const nonEntries = [
      undefined,
      null,
      'pay',
      42,
      { fromStateName: 'placed', toStateName: 'paid', eventName: 'pay' },
      new Transition(payMove),
    ]

    for (const nonEntry of nonEntries) {
      expect(() => history.record(nonEntry)).toThrow(TypeError)
    }
  })

  it('leaves the entries unchanged when record throws a TypeError', () => {
    const history = new TransitionHistory()
    const paying = new HistoryEntry(new Transition(payMove))
    history.record(paying)

    expect(() => history.record(new Transition(shipMove))).toThrow(TypeError)
    expectSameItems(history.entries, [paying])
  })

  it('removes the newest entry', () => {
    const history = new TransitionHistory()
    const paying = new HistoryEntry(new Transition(payMove))
    history.record(paying)
    history.record(new HistoryEntry(new Transition(shipMove)))

    history.removeNewestEntry()

    expectSameItems(history.entries, [paying])
  })

  it('returns the entry it removes', () => {
    const history = new TransitionHistory()
    history.record(new HistoryEntry(new Transition(payMove)))
    const shipping = new HistoryEntry(new Transition(shipMove))
    history.record(shipping)

    expect(history.removeNewestEntry()).toBe(shipping)
  })

  it('returns undefined when there is no entry to remove', () => {
    const history = new TransitionHistory()

    expect(history.removeNewestEntry()).toBeUndefined()
  })
})
