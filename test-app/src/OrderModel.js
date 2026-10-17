import { StateMachine } from 'flowstate-js'

const AMOUNT_PAY_MUST_EXCEED = 50

/**
 * @typedef {{ from: string, on: string, to: string, guardRule?: string }} MoveDescription
 */

/**
 * The one order the Test-App runs. Every state has hooks that report when they run, and pay has a guard.
 */
export class OrderModel {
  #machine = new StateMachine('placed')
  #stateNames = ['placed', 'paid', 'shipped', 'delivered', 'cancelled']

  /** @type {MoveDescription[]} */
  #moveDescriptions = []

  /**
   * Starts the order in placed, with an amount of 0.
   *
   * @param {(hookName: string, stateName: string) => void} reportHook - Called each time a hook runs.
   */
  constructor(reportHook) {
    this.#defineStates(reportHook)
    this.#defineMoves()
    this.#machine.context.amount = 0
  }

  /**
   * Gives out the machine itself, so the Test-App can call its API as it is.
   *
   * @returns {StateMachine} The order's machine.
   */
  get machine() {
    return this.#machine
  }

  /**
   * A shortcut for machine.currentStateName.
   *
   * @returns {string} A state name.
   */
  get currentStateName() {
    return this.#machine.currentStateName
  }

  /**
   * A shortcut for listEventNamesFrom with the current state.
   *
   * @returns {string[]} Event names, none in an end state.
   */
  listEventsLeadingOut() {
    return this.#machine.listEventNamesFrom(this.#machine.currentStateName)
  }

  /**
   * Each transition as data, in definition order.
   *
   * @returns {MoveDescription[]} A new array each time, with frozen entries.
   */
  describeMoves() {
    return [...this.#moveDescriptions]
  }

  /**
   * Every state gets an onEnter and an onExit hook.
   *
   * @param {(hookName: string, stateName: string) => void} reportHook - Called each time a hook runs.
   */
  #defineStates(reportHook) {
    for (const stateName of this.#stateNames) {
      /** Reports that the order entered the state. */
      const onEnter = () => {
        reportHook('onEnter', stateName)
      }
      /** Reports that the order left the state. */
      const onExit = () => {
        reportHook('onExit', stateName)
      }

      this.#machine.defineState(stateName, { onEnter, onExit })
    }
  }

  /** Only pay has a guard. */
  #defineMoves() {
    const payRule = `context.amount > ${AMOUNT_PAY_MUST_EXCEED}`

    this.#defineMove({ from: 'placed', to: 'paid', on: 'pay', guard: this.#hasAmountToPay }, payRule)
    this.#defineMove({ from: 'placed', to: 'cancelled', on: 'cancel' })
    this.#defineMove({ from: 'paid', to: 'shipped', on: 'ship' })
    this.#defineMove({ from: 'paid', to: 'cancelled', on: 'cancel' })
    this.#defineMove({ from: 'shipped', to: 'delivered', on: 'deliver' })
  }

  /**
   * Also keeps a frozen description of the move.
   *
   * @param {{ from: string, to: string, on: string, guard?: (ctx: object) => boolean }} move - As for defineTransition.
   * @param {string} [guardRule] - Such as "context.amount > 50".
   */
  #defineMove(move, guardRule) {
    const moveDescription = Object.freeze({ from: move.from, on: move.on, to: move.to, guardRule })

    this.#machine.defineTransition(move)
    this.#moveDescriptions.push(moveDescription)
  }

  /**
   * The guard on pay.
   *
   * @param {object} ctx - The context.
   * @returns {boolean} True if the amount is above the limit.
   */
  #hasAmountToPay = (ctx) => ctx.amount > AMOUNT_PAY_MUST_EXCEED
}
