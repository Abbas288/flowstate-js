import { Transition } from './Transition.js'

/**
 * An unchangeable record of one move the machine has made.
 */
export class HistoryEntry {
  #fromStateName
  #toStateName
  #eventName

  /**
   * Takes the names of the two states and the event from the transition. The guard
   * is left out, since the move has already happened.
   *
   * @param {Transition} transition - The transition the machine moved along.
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
   * The machine was in this state when the event was sent.
   *
   * @returns {string} - Name of the state the machine left.
   */
  get fromStateName() {
    return this.#fromStateName
  }

  /**
   * This may be the same state that the machine left.
   *
   * @returns {string} - Name of the state the machine entered.
   */
  get toStateName() {
    return this.#toStateName
  }

  /**
   * This is the name that was passed to send.
   *
   * @returns {string} - Name of the event that made the machine move.
   */
  get eventName() {
    return this.#eventName
  }
}
