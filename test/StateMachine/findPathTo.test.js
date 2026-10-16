import { describe, expect, it, vi } from 'vitest'
import { StateMachine } from '../../src/StateMachine.js'
import { NoPathError, UnknownStateError } from '../../src/errors.js'
import { invalidNames } from '../helpers/fixtures.js'
import { makeMachineWithStates } from '../helpers/makeMachineWithStates.js'

describe('StateMachine', () => {
  describe('findPathTo', () => {
    it('finds the shortest chain of events from the state the machine is in', () => {
      const order = makeMachineWithStates('placed', 'paid', 'shipped', 'delivered')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })
      order.defineTransition({ from: 'shipped', to: 'delivered', on: 'deliver' })
      order.send('pay')

      expect(order.findPathTo('delivered')).toEqual(['ship', 'deliver'])
    })

    it('gives an empty chain when the machine is already in the state', () => {
      const order = makeMachineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      expect(order.findPathTo('placed')).toEqual([])
    })

    it('throws a NoPathError naming both states when no chain of events leads there', () => {
      const order = makeMachineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.send('pay')

      expect(() => order.findPathTo('placed')).toThrow(NoPathError)
      expect(() => order.findPathTo('placed')).toThrow(
        expect.objectContaining({ fromStateName: 'paid', toStateName: 'placed' })
      )
    })

    it('does not ask the guards', () => {
      const guard = vi.fn(() => false)
      const order = makeMachineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay', guard })

      const path = order.findPathTo('paid')

      expect(path).toEqual(['pay'])
      expect(guard).not.toHaveBeenCalled()
    })

    it('neither moves the machine nor runs a hook', () => {
      const calls = []
      const order = new StateMachine('placed')
      order.defineState('placed', { onExit: () => calls.push('exit placed') })
      order.defineState('paid', { onEnter: () => calls.push('enter paid') })
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      order.findPathTo('paid')

      expect(order.currentStateName).toBe('placed')
      expect(calls).toEqual([])
    })

    it('throws an UnknownStateError for a state that was never defined', () => {
      const order = makeMachineWithStates('placed')

      expect(() => order.findPathTo('shipped')).toThrow(UnknownStateError)
      expect(() => order.findPathTo('shipped')).toThrow(expect.objectContaining({ stateName: 'shipped' }))
    })

    it('throws an UnknownStateError instead of a NoPathError when the starting state was never defined', () => {
      const order = new StateMachine('draft')
      order.defineState('placed').defineState('paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      expect(() => order.findPathTo('paid')).toThrow(UnknownStateError)
      expect(() => order.findPathTo('paid')).toThrow(expect.objectContaining({ stateName: 'draft' }))
    })

    it('throws a TypeError when the state name is not a non-empty string', () => {
      const order = makeMachineWithStates('placed')

      for (const invalidName of invalidNames) {
        expect(() => order.findPathTo(invalidName)).toThrow(TypeError)
      }
    })

    it('cannot be changed through the path it returns', () => {
      const order = makeMachineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      order.findPathTo('paid').push('forge')

      expect(order.findPathTo('paid')).toEqual(['pay'])
    })
  })
})
