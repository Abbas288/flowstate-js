import { describe, expect, it } from 'vitest'
import {
  BlockedTransitionError,
  FlowStateError,
  NoPathError,
  NoTransitionError,
  StateMachine,
} from '../../src/index.js'

/**
 * An order that is placed, paid when the amount is above 0, shipped,
 * and can be cancelled until it is shipped.
 * Its hooks write each state they enter or leave in ctx.log.
 *
 * @returns {StateMachine} A new machine in "placed".
 */
const createOrder = () => {
  const order = new StateMachine('placed')

  order.context.log = []

  const logEnter = (stateName) => (ctx) => ctx.log.push(`enter ${stateName}`)
  const logExit = (stateName) => (ctx) => ctx.log.push(`exit ${stateName}`)

  for (const stateName of ['placed', 'paid', 'shipped', 'cancelled']) {
    order.defineState(stateName, { onEnter: logEnter(stateName), onExit: logExit(stateName) })
  }

  return order
    .defineTransition({ from: 'placed', to: 'paid', on: 'pay', guard: (ctx) => ctx.amount > 0 })
    .defineTransition({ from: 'paid', to: 'shipped', on: 'ship' })
    .defineTransition({ from: 'placed', to: 'cancelled', on: 'cancel' })
    .defineTransition({ from: 'paid', to: 'cancelled', on: 'cancel' })
}

describe('An order through the public interface', () => {
  it('works with the v1 interface as before', () => {
    const order = createOrder()

    const blockedPayment = () => order.send('pay')

    expect(order.canSend('pay')).toBe(false)
    expect(blockedPayment).toThrow(BlockedTransitionError)

    order.context.amount = 250
    order.send('pay')

    expect(order.eventNamesFrom('paid')).toEqual(['ship', 'cancel'])

    order.send('ship')

    const lateCancel = () => order.send('cancel')

    expect(order.currentStateName).toBe('shipped')
    expect(order.stateNames).toEqual(['placed', 'paid', 'shipped', 'cancelled'])
    expect(order.context.log).toEqual(['exit placed', 'enter paid', 'exit paid', 'enter shipped'])
    expect(lateCancel).toThrow(NoTransitionError)
    expect(lateCancel).toThrow(FlowStateError)
  })

  it('adds history, undo and path search (v2) to the same machine', () => {
    const order = createOrder()

    order.context.amount = 250

    expect(order.listEventNamesFrom('paid')).toEqual(order.eventNamesFrom('paid'))
    expect(order.findPathTo('shipped')).toEqual(['pay', 'ship'])

    order.send('pay')
    order.send('cancel')

    const pathOut = () => order.findPathTo('shipped')

    expect(order.history.map((entry) => entry.eventName)).toEqual(['pay', 'cancel'])
    expect(order.canReach('shipped')).toBe(false)
    expect(pathOut).toThrow(NoPathError)

    order.undoLastMove()

    expect(order.currentStateName).toBe('paid')
    expect(order.canReach('shipped')).toBe(true)
    expect(order.context.log.slice(-2)).toEqual(['exit cancelled', 'enter paid'])
  })
})
