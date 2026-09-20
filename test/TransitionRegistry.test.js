import { describe, expect, it } from 'vitest'
import { Transition } from '../src/Transition.js'
import { TransitionRegistry } from '../src/TransitionRegistry.js'

const payMove = { from: 'placed', to: 'paid', on: 'pay' }
const shipMove = { from: 'paid', to: 'shipped', on: 'ship' }

describe('TransitionRegistry', () => {
  it('finds a transition by the state it leaves and the event it answers to', () => {
    const registry = new TransitionRegistry()
    const pay = new Transition(payMove)

    registry.register(pay)

    expect(registry.find('placed', 'pay')).toBe(pay)
  })

  it('finds nothing while empty', () => {
    const registry = new TransitionRegistry()

    expect(registry.find('placed', 'pay')).toBeUndefined()
  })

  it('finds nothing when the event does not match', () => {
    const registry = new TransitionRegistry()
    registry.register(new Transition(payMove))

    expect(registry.find('placed', 'ship')).toBeUndefined()
  })

  it('finds nothing when the state does not match', () => {
    const registry = new TransitionRegistry()
    registry.register(new Transition(payMove))

    expect(registry.find('paid', 'pay')).toBeUndefined()
  })

  it('tells two transitions apart that share an event name', () => {
    const registry = new TransitionRegistry()
    const cancelPlaced = new Transition({ from: 'placed', to: 'void', on: 'cancel' })
    const cancelPaid = new Transition({ from: 'paid', to: 'refunded', on: 'cancel' })

    registry.register(cancelPlaced)
    registry.register(cancelPaid)

    expect(registry.find('placed', 'cancel')).toBe(cancelPlaced)
    expect(registry.find('paid', 'cancel')).toBe(cancelPaid)
  })

  it('returns the first match when two transitions are alike', () => {
    const registry = new TransitionRegistry()
    const first = new Transition(payMove)
    const second = new Transition(payMove)

    registry.register(first)
    registry.register(second)

    expect(registry.find('placed', 'pay')).toBe(first)
  })

  it('ignores guards when searching', () => {
    const registry = new TransitionRegistry()
    const guardedPay = new Transition({ ...payMove, guard: () => false })

    registry.register(guardedPay)

    expect(registry.find('placed', 'pay')).toBe(guardedPay)
  })

  it('keeps registries independent of each other', () => {
    const orders = new TransitionRegistry()
    const invoices = new TransitionRegistry()

    orders.register(new Transition(payMove))

    expect(invoices.find('placed', 'pay')).toBeUndefined()
  })

  it('lists every way out of a state, in registration order', () => {
    const registry = new TransitionRegistry()
    const pay = new Transition(payMove)
    const cancel = new Transition({ from: 'placed', to: 'void', on: 'cancel' })

    registry.register(pay)
    registry.register(cancel)

    expect(registry.transitionsFrom('placed')).toEqual([pay, cancel])
  })

  it('lists no way out of a state that has none', () => {
    const registry = new TransitionRegistry()
    registry.register(new Transition(payMove))

    expect(registry.transitionsFrom('shipped')).toEqual([])
  })

  it('lists no way out while empty', () => {
    const registry = new TransitionRegistry()

    expect(registry.transitionsFrom('placed')).toEqual([])
  })

  it('leaves out transitions that start somewhere else', () => {
    const registry = new TransitionRegistry()
    const pay = new Transition(payMove)

    registry.register(pay)
    registry.register(new Transition(shipMove))

    expect(registry.transitionsFrom('placed')).toEqual([pay])
  })

  it('lists a transition even when its guard says no', () => {
    const registry = new TransitionRegistry()
    const guardedPay = new Transition({ ...payMove, guard: () => false })

    registry.register(guardedPay)

    expect(registry.transitionsFrom('placed')).toEqual([guardedPay])
  })

  it('lists a transition that returns to the same state', () => {
    const registry = new TransitionRegistry()
    const confirm = new Transition({ from: 'paid', to: 'paid', on: 'confirm' })

    registry.register(confirm)

    expect(registry.transitionsFrom('paid')).toEqual([confirm])
  })

  it('cannot be changed through the list it returns', () => {
    const registry = new TransitionRegistry()
    registry.register(new Transition(payMove))

    registry.transitionsFrom('placed').push(new Transition(shipMove))

    expect(registry.transitionsFrom('placed')).toHaveLength(1)
  })

  it('rejects values that are not transitions', () => {
    const registry = new TransitionRegistry()
    const nonTransitions = ['pay', 42, {}, payMove, null, undefined]

    for (const nonTransition of nonTransitions) {
      expect(() => registry.register(nonTransition)).toThrow(TypeError)
    }
  })

  it('keeps every registered transition, even alike ones', () => {
    const registry = new TransitionRegistry()

    registry.register(new Transition(payMove))
    registry.register(new Transition(shipMove))

    expect(registry.find('placed', 'pay')).toBeDefined()
    expect(registry.find('paid', 'ship')).toBeDefined()
  })
})
