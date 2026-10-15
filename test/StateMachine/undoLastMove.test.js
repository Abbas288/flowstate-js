import { describe, expect, it, vi } from 'vitest'
import { StateMachine } from '../../src/StateMachine.js'
import { machineWithStates } from '../helpers/machineWithStates.js'
import { recordedMoves } from '../helpers/recordedMoves.js'

describe('StateMachine', () => {
  describe('undoLastMove', () => {
    it('moves back to the state it left on its last move', () => {
      const order = machineWithStates('placed', 'paid', 'shipped')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })
      order.send('pay')
      order.send('ship')

      order.undoLastMove()

      expect(order.currentStateName).toBe('paid')
    })

    it('removes the undone move from the history', () => {
      const order = machineWithStates('placed', 'paid', 'shipped')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })
      order.send('pay')
      order.send('ship')

      order.undoLastMove()

      expect(recordedMoves(order)).toEqual([{ from: 'placed', to: 'paid', on: 'pay' }])
    })

    it('undoes one move per call, back to the starting state', () => {
      const order = machineWithStates('placed', 'paid', 'shipped')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })
      order.send('pay')
      order.send('ship')

      order.undoLastMove()
      order.undoLastMove()

      expect(order.currentStateName).toBe('placed')
      expect(order.history).toEqual([])
    })

    it('does nothing when there is no move to undo', () => {
      const calls = []
      const order = new StateMachine('placed')
      order.defineState('placed', {
        onEnter: () => calls.push('enter placed'),
        onExit: () => calls.push('exit placed'),
      })

      order.undoLastMove()

      expect(order.currentStateName).toBe('placed')
      expect(calls).toEqual([])
    })

    it('returns nothing, whether or not there was a move to undo', () => {
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.send('pay')

      const resultAfterAMove = order.undoLastMove()
      const resultWithNothingToUndo = order.undoLastMove()

      expect(resultAfterAMove).toBeUndefined()
      expect(resultWithNothingToUndo).toBeUndefined()
    })

    it('moves back without asking the guard', () => {
      const guard = vi.fn(() => true)
      const order = machineWithStates('placed', 'paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay', guard })
      order.send('pay')
      guard.mockClear()

      order.undoLastMove()

      expect(guard).not.toHaveBeenCalled()
    })

    it('runs the exit hook of the state it leaves, then the enter hook of the state it moves back to', () => {
      const calls = []
      const order = new StateMachine('placed')
      order.defineState('placed', { onEnter: () => calls.push('enter placed') })
      order.defineState('paid', { onExit: () => calls.push('exit paid') })
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.send('pay')

      order.undoLastMove()

      expect(calls).toEqual(['exit paid', 'enter placed'])
    })

    it('does not undo what the hooks wrote into the context', () => {
      const order = new StateMachine('placed')
      order.defineState('placed')
      order.defineState('paid', {
        onEnter: (ctx) => {
          ctx.paid = true
        },
      })
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.send('pay')

      order.undoLastMove()

      expect(order.context.paid).toBe(true)
    })

    it('keeps the current state and the move in the history when the exit hook throws an error', () => {
      const order = new StateMachine('placed')
      order.defineState('placed')
      order.defineState('paid', {
        onExit: () => {
          throw new Error('exit failed')
        },
      })
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.send('pay')

      expect(() => order.undoLastMove()).toThrow('exit failed')
      expect(order.currentStateName).toBe('paid')
      expect(recordedMoves(order)).toEqual([{ from: 'placed', to: 'paid', on: 'pay' }])
    })

    it('has already moved back and removed the move when the enter hook throws an error', () => {
      const order = new StateMachine('placed')
      order.defineState('placed', {
        onEnter: () => {
          throw new Error('enter failed')
        },
      })
      order.defineState('paid')
      order.defineTransition({ from: 'placed', to: 'paid', on: 'pay' })
      order.send('pay')

      expect(() => order.undoLastMove()).toThrow('enter failed')
      expect(order.currentStateName).toBe('placed')
      expect(order.history).toEqual([])
    })
  })
})
