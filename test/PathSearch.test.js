import { describe, expect, it } from 'vitest'
import { PathSearch } from '../src/PathSearch.js'
import { Transition } from '../src/Transition.js'
import { TransitionRegistry } from '../src/TransitionRegistry.js'
import { NoPathError } from '../src/errors.js'

/**
 * Searches from a state over the given moves, registered in the order given.
 *
 * @param {string} startStateName - Name of the state to start in.
 * @param {...object} moves - The moves, in the shape defineTransition takes.
 * @returns {PathSearch} The search from that state.
 */
const searchFrom = (startStateName, ...moves) => {
  const transitions = new TransitionRegistry()

  for (const move of moves) {
    transitions.register(new Transition(move))
  }

  return new PathSearch(transitions, startStateName)
}

describe('PathSearch', () => {
  it('finds the event that leads straight to a neighbour', () => {
    const searchFromPlaced = searchFrom('placed', { from: 'placed', to: 'paid', on: 'pay' })

    expect(searchFromPlaced.pathTo('paid')).toEqual(['pay'])
  })

  it('finds a chain of events across several states', () => {
    const searchFromPlaced = searchFrom(
      'placed',
      { from: 'placed', to: 'paid', on: 'pay' },
      { from: 'paid', to: 'packed', on: 'pack' },
      { from: 'packed', to: 'shipped', on: 'ship' }
    )

    expect(searchFromPlaced.pathTo('shipped')).toEqual(['pay', 'pack', 'ship'])
  })

  it('finds the shortest chain when a longer one was defined first', () => {
    const searchFromPlaced = searchFrom(
      'placed',
      { from: 'placed', to: 'reviewed', on: 'review' },
      { from: 'reviewed', to: 'approved', on: 'approve' },
      { from: 'approved', to: 'paid', on: 'pay' },
      { from: 'placed', to: 'paid', on: 'pay' }
    )

    expect(searchFromPlaced.pathTo('paid')).toEqual(['pay'])
  })

  it('finds the shortest chain when a longer one also leads there', () => {
    const searchFromPlaced = searchFrom(
      'placed',
      { from: 'placed', to: 'paid', on: 'pay' },
      { from: 'placed', to: 'reviewed', on: 'review' },
      { from: 'paid', to: 'shipped', on: 'ship' },
      { from: 'reviewed', to: 'approved', on: 'approve' },
      { from: 'approved', to: 'shipped', on: 'ship' }
    )

    expect(searchFromPlaced.pathTo('shipped')).toEqual(['pay', 'ship'])
  })

  it('picks the chain defined first when two are equally short', () => {
    const searchFromPlaced = searchFrom(
      'placed',
      { from: 'placed', to: 'paid', on: 'payByCard' },
      { from: 'placed', to: 'paid', on: 'payByInvoice' }
    )

    expect(searchFromPlaced.pathTo('paid')).toEqual(['payByCard'])
  })

  it('gives an empty chain to the start state', () => {
    const searchFromPlaced = searchFrom('placed', { from: 'placed', to: 'paid', on: 'pay' })

    expect(searchFromPlaced.pathTo('placed')).toEqual([])
  })

  it('throws a NoPathError naming both states when no chain leads to the state', () => {
    const searchFromPaid = searchFrom('paid', { from: 'placed', to: 'paid', on: 'pay' })

    expect(() => searchFromPaid.pathTo('placed')).toThrow(NoPathError)
    expect(() => searchFromPaid.pathTo('placed')).toThrow(
      expect.objectContaining({ fromStateName: 'paid', toStateName: 'placed' })
    )
  })

  it('ends its search in a graph with a cycle', () => {
    const searchFromPlaced = searchFrom(
      'placed',
      { from: 'placed', to: 'paid', on: 'pay' },
      { from: 'paid', to: 'placed', on: 'refund' },
      { from: 'shipped', to: 'delivered', on: 'deliver' }
    )

    expect(() => searchFromPlaced.pathTo('delivered')).toThrow(NoPathError)
  })

  it('finds a chain through a cycle', () => {
    const searchFromPlaced = searchFrom(
      'placed',
      { from: 'placed', to: 'paid', on: 'pay' },
      { from: 'paid', to: 'placed', on: 'refund' },
      { from: 'paid', to: 'shipped', on: 'ship' }
    )

    expect(searchFromPlaced.pathTo('shipped')).toEqual(['pay', 'ship'])
  })

  it('does not ask the guards', () => {
    const searchFromPlaced = searchFrom('placed', { from: 'placed', to: 'paid', on: 'pay', guard: () => false })

    expect(searchFromPlaced.pathTo('paid')).toEqual(['pay'])
  })

  it('tells whether a chain leads to the state', () => {
    const searchFromPaid = searchFrom(
      'paid',
      { from: 'placed', to: 'paid', on: 'pay' },
      { from: 'paid', to: 'shipped', on: 'ship' }
    )

    expect(searchFromPaid.reaches('shipped')).toBe(true)
    expect(searchFromPaid.reaches('placed')).toBe(false)
  })

  it('reaches the start state', () => {
    const searchFromPaid = searchFrom('paid', { from: 'placed', to: 'paid', on: 'pay' })

    expect(searchFromPaid.reaches('paid')).toBe(true)
  })

  it('cannot be changed through the path it returns', () => {
    const searchFromPlaced = searchFrom('placed', { from: 'placed', to: 'paid', on: 'pay' })

    searchFromPlaced.pathTo('paid').push('forge')

    expect(searchFromPlaced.pathTo('paid')).toEqual(['pay'])
  })

  it('rejects transitions that are not a transition registry', () => {
    const nonRegistries = [undefined, null, [], {}, { findAll: () => [] }]

    for (const nonRegistry of nonRegistries) {
      expect(() => new PathSearch(nonRegistry, 'placed')).toThrow(TypeError)
    }
  })
})
