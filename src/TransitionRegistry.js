import { Transition } from './Transition.js'

/**
 * Stores the transitions belonging to one machine and finds them by state and event.
 */
export class TransitionRegistry {
  #transitions = []

  /**
   * Stores a transition for later lookup. Two identical transitions are both kept.
   *
   * @param {Transition} transition - The transition to store.
   */
  register (transition) {
    if (!(transition instanceof Transition)) {
      throw new TypeError('Only Transition instances can be registered.')
    }

    this.#transitions.push(transition)
  }

  /**
   * The transition registered first wins when several of them match.
   *
   * @param {string} fromStateName - Name of the state to leave.
   * @param {string} eventName - Name of the event being sent.
   * @returns {Transition|undefined} - The match, or undefined if there is none.
   */
  find (fromStateName, eventName) {
    return this.transitionsFrom(fromStateName)
      .find((transition) => transition.isTriggeredBy(eventName))
  }

  /**
   * Guards are ignored, so every way out is listed. The array is a copy,
   * so changing it cannot affect the registry.
   *
   * @param {string} fromStateName - Name of the state to leave.
   * @returns {Transition[]} - The transitions leaving that state, in registration order.
   */
  transitionsFrom (fromStateName) {
    return this.#transitions.filter(
      (transition) => transition.fromStateName === fromStateName
    )
  }
}
