import { Transition } from './Transition.js'

/**
 * An unchangeable record of one move the machine has made.
 */
export class HistoryEntry {
  #fromStateName
  #toStateName
  #eventName

  /**
   * Creates an entry for a move along the transition. Keeps the three names, not the guard.
   *
   * @param {Transition} transition - The transition the machine moved along.
   * @throws {TypeError} If the value is not a Transition.
   */
  constructor(transition) {
    if (!(transition instanceof Transition)) {
      throw new TypeError('Only Transition instances can be recorded.')
    }

    this.#fromStateName = transition.fromStateName
    this.#toStateName = transition.toStateName
    this.#eventName = transition.eventName
  }

  /**
   * Gets the name of the state the machine left. It was the current state when the event
   * was sent.
   *
   * @returns {string} Name of the state the machine left.
   */
  get fromStateName() {
    return this.#fromStateName
  }

  /**
   * Gets the name of the state the machine entered. It may be the same as the state it left.
   *
   * @returns {string} Name of the state the machine entered.
   */
  get toStateName() {
    return this.#toStateName
  }

  /**
   * Gets the name of the event that made the machine move.
   *
   * @returns {string} Name of the event that made the machine move.
   */
  get eventName() {
    return this.#eventName
  }
}
