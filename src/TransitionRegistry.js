import { Transition } from './Transition.js'

/**
 * Stores the transitions belonging to one machine and finds them by state and event.
 */
export class TransitionRegistry {
  #transitions = []

  /**
   * Stores a transition so that it can later be found.
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
   * Finds the transition that leaves a state on a given event.
   *
   * @param {string} fromStateName - Name of the state to leave.
   * @param {string} eventName - Name of the event being sent.
   * @returns {Transition|undefined} - The matching transition, or undefined if there
   *   is none. When several match, the one registered first wins.
   */
  find (fromStateName, eventName) {
    return this.#transitions.find((transition) =>
      transition.fromStateName === fromStateName && transition.isTriggeredBy(eventName)
    )
  }
}
