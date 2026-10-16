import { describe, expect, it, vi } from 'vitest'
import { StateMachine } from '../../src/StateMachine.js'
import { UnknownStateError } from '../../src/errors.js'
import { invalidNames } from '../helpers/fixtures.js'
import { machineWithStates } from '../helpers/machineWithStates.js'

describe('StateMachine', () => {
  describe('canReach', () => {
    it('answers true when a chain of events leads to the state', () => {
      const order = machineWithStates('placed', 'paid', 'shipped')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })

      expect(order.canReach('shipped')).toBe(true)
    })

    it('answers false when no chain of events leads to the state', () => {
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.send('pay')

      expect(order.canReach('placed')).toBe(false)
    })

    it('answers true for the state the machine is in', () => {
      const order = machineWithStates('placed')

      expect(order.canReach('placed')).toBe(true)
    })

    it('does not ask the guards', () => {
      const guard = vi.fn(() => false)
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay', guard })

      const reachable = order.canReach('paid')

      expect(reachable).toBe(true)
      expect(guard).not.toHaveBeenCalled()
    })

    it('throws an UnknownStateError for a state that was never defined', () => {
      const order = machineWithStates('placed')

      expect(() => order.canReach('shipped')).toThrow(UnknownStateError)
    })

    it('throws an UnknownStateError instead of returning false when the starting state was never defined', () => {
      const order = new StateMachine('draft')
      order.defineState('placed').defineState('paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      expect(() => order.canReach('paid')).toThrow(UnknownStateError)
      expect(() => order.canReach('paid')).toThrow(expect.objectContaining({ stateName: 'draft' }))
    })

    it('throws a TypeError when the state name is not a non-empty string', () => {
      const order = machineWithStates('placed')

      for (const invalidName of invalidNames) {
        expect(() => order.canReach(invalidName)).toThrow(TypeError)
      }
    })
  })
})
