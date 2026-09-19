import { describe, expect, it } from 'vitest'
import { State } from '../src/State.js'
import { StateRegistry } from '../src/StateRegistry.js'

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

  it('rejects values that are not states', () => {
    const registry = new StateRegistry()
    const nonStates = ['paid', 42, {}, { name: 'paid' }, null, undefined]

    for (const nonState of nonStates) {
      expect(() => registry.register(nonState)).toThrow(TypeError)
    }
  })
})
