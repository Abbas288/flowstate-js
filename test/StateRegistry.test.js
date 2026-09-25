import { describe, expect, it } from 'vitest'
import { State } from '../src/State.js'
import { StateRegistry } from '../src/StateRegistry.js'
import { DuplicateStateError } from '../src/errors.js'

describe('StateRegistry', () => {
  it('finds a state that has been registered', () => {
    const registry = new StateRegistry()

    registry.register(new State('paid'))

    expect(registry.has('paid')).toBe(true)
  })

  it('does not find a name that was never registered', () => {
    const registry = new StateRegistry()

    registry.register(new State('paid'))

    expect(registry.has('shipped')).toBe(false)
  })

  it('finds nothing before anything is registered', () => {
    const registry = new StateRegistry()

    expect(registry.has('paid')).toBe(false)
  })

  it('keeps registries independent of each other', () => {
    const orders = new StateRegistry()
    const invoices = new StateRegistry()

    orders.register(new State('paid'))

    expect(invoices.has('paid')).toBe(false)
  })

  it('hands back the very state that was registered', () => {
    const registry = new StateRegistry()
    const paid = new State('paid')

    registry.register(paid)

    expect(registry.get('paid')).toBe(paid)
  })

  it('hands back nothing for a name that was never registered', () => {
    const registry = new StateRegistry()

    expect(registry.get('shipped')).toBeUndefined()
  })

  it('lists the names of every registered state in registration order', () => {
    const registry = new StateRegistry()

    registry.register(new State('placed'))
    registry.register(new State('paid'))
    registry.register(new State('shipped'))

    expect(registry.stateNames).toEqual(['placed', 'paid', 'shipped'])
  })

  it('lists no names while empty', () => {
    const registry = new StateRegistry()

    expect(registry.stateNames).toEqual([])
  })

  it('cannot be changed through the list of names it hands out', () => {
    const registry = new StateRegistry()
    registry.register(new State('paid'))

    registry.stateNames.push('forged')

    expect(registry.stateNames).toEqual(['paid'])
    expect(registry.has('forged')).toBe(false)
  })

  it('rejects values that are not states', () => {
    const registry = new StateRegistry()
    const nonStates = ['paid', 42, {}, { name: 'paid' }, null, undefined]

    for (const nonState of nonStates) {
      expect(() => registry.register(nonState)).toThrow(TypeError)
    }
  })

  it('rejects a name that is already registered', () => {
    const registry = new StateRegistry()
    registry.register(new State('paid'))

    expect(() => registry.register(new State('paid'))).toThrow(DuplicateStateError)
  })

  it('names the rejected state in the error', () => {
    const registry = new StateRegistry()
    registry.register(new State('paid'))

    expect(() => registry.register(new State('paid'))).toThrow(/paid/)
  })

  it('keeps the first state when it rejects a duplicate name', () => {
    const registry = new StateRegistry()
    const firstPaid = new State('paid')
    registry.register(firstPaid)

    expect(() => registry.register(new State('paid'))).toThrow(DuplicateStateError)
    expect(registry.get('paid')).toBe(firstPaid)
  })

  it('still accepts a different name after rejecting a duplicate', () => {
    const registry = new StateRegistry()
    registry.register(new State('paid'))

    expect(() => registry.register(new State('paid'))).toThrow(DuplicateStateError)
    registry.register(new State('shipped'))

    expect(registry.stateNames).toEqual(['paid', 'shipped'])
  })
})
