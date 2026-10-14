import { describe, expect, it } from 'vitest'
import { StateMachine } from '../../src/StateMachine.js'
import { BlockedTransitionError, NoTransitionError } from '../../src/errors.js'
import { machineWithStates } from '../helpers/machineWithStates.js'
import { recordedMoves } from '../helpers/recordedMoves.js'

describe('StateMachine', () => {
  describe('history', () => {
    it('is empty before any event is sent', () => {
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      expect(order.history).toEqual([])
    })

    it('records each move, oldest first', () => {
      const order = machineWithStates('placed', 'paid', 'shipped')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })

      order.send('pay')
      order.send('ship')

      expect(recordedMoves(order)).toEqual([
        { from: 'placed', to: 'paid', on: 'pay' },
        { from: 'paid', to: 'shipped', on: 'ship' },
      ])
    })

    it('records the transition whose guard allowed the move', () => {
      const order = machineWithStates('placed', 'paid', 'rejected')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay', guard: () => false })
      order.defineTransition({ from: 'placed', to: 'rejected', on: 'pay', guard: () => true })

      order.send('pay')

      expect(recordedMoves(order)).toEqual([{ from: 'placed', to: 'rejected', on: 'pay' }])
    })

    it('records no move when send throws a NoTransitionError', () => {
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      expect(() => order.send('ship')).toThrow(NoTransitionError)
      expect(order.history).toEqual([])
    })

    it('records no move when send throws a BlockedTransitionError', () => {
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay', guard: () => false })

      expect(() => order.send('pay')).toThrow(BlockedTransitionError)
      expect(order.history).toEqual([])
    })

    it('records no move when the exit hook throws an error', () => {
      const order = new StateMachine('placed')
      order.defineState('placed', {
        onExit: () => {
          throw new Error('exit failed')
        },
      })
      order.defineState('paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      expect(() => order.send('pay')).toThrow('exit failed')
      expect(order.history).toEqual([])
    })

    it('records the move when the enter hook throws an error', () => {
      const order = new StateMachine('placed')
      order.defineState('placed')
      order.defineState('paid', {
        onEnter: () => {
          throw new Error('enter failed')
        },
      })
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      expect(() => order.send('pay')).toThrow('enter failed')
      expect(recordedMoves(order)).toEqual([{ from: 'placed', to: 'paid', on: 'pay' }])
    })

    it('records no move when canSend answers true', () => {
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })

      expect(order.canSend('pay')).toBe(true)
      expect(order.history).toEqual([])
    })

    it('returns a copy, so removing a move from it leaves the history unchanged', () => {
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.send('pay')

      const returnedHistory = order.history
      returnedHistory.pop()

      expect(recordedMoves(order)).toEqual([{ from: 'placed', to: 'paid', on: 'pay' }])
    })
  })
})
