import { TransitionRegistry } from './TransitionRegistry.js'
import { NoPathError } from './errors.js'

/**
 * @typedef {import('./Transition.js').Transition} Transition
 */

/**
 * A breadth-first search for the shortest chain of events from one state to each state it can
 * reach. Guards are not asked.
 */
export class PathSearch {
  #transitions
  #startStateName

  /** @type {Map<string, string[]>} The shortest path from the start state to each state reached. */
  #pathsByStateName = new Map()

  /** @type {string[]} States waiting to be visited, in the order they were reached. */
  #statesToVisit = []

  /**
   * Searches the transitions from the start state.
   *
   * @param {TransitionRegistry} transitions - The transitions to search.
   * @param {string} startStateName - Name of the state to start in.
   * @throws {TypeError} If the transitions are not a TransitionRegistry.
   */
  constructor(transitions, startStateName) {
    this.#transitions = this.#requireTransitionRegistry(transitions)
    this.#startStateName = startStateName

    const pathToStartState = []

    this.#recordPath(startStateName, pathToStartState)
    this.#searchBreadthFirst()
  }

  /**
   * Gets the shortest chain of events from the start state to the state. Ties go to the transitions
   * defined first.
   *
   * @param {string} stateName - Name of the state to reach.
   * @returns {string[]} The event names in sending order, in a new array each time. Empty for the
   *   start state.
   * @throws {NoPathError} If no chain of events leads there.
   */
  pathTo(stateName) {
    if (!this.reaches(stateName)) {
      throw new NoPathError(this.#startStateName, stateName)
    }

    const pathToState = this.#pathsByStateName.get(stateName)

    return [...pathToState]
  }

  /**
   * Tells whether a chain of events leads from the start state to the state.
   *
   * @param {string} stateName - Name of the state to reach.
   * @returns {boolean} True if pathTo would find a chain.
   */
  reaches(stateName) {
    return this.#pathsByStateName.has(stateName)
  }

  /**
   * Visits the nearest states first. The first path recorded to a state is a shortest one.
   */
  #searchBreadthFirst() {
    while (this.#statesToVisit.length > 0) {
      const nextStateName = this.#statesToVisit.shift()

      this.#followTransitionsFrom(nextStateName)
    }
  }

  /**
   * Follows each transition that leaves the state.
   *
   * @param {string} stateName - Name of the state to follow transitions from.
   */
  #followTransitionsFrom(stateName) {
    const transitionsLeavingState = this.#transitions.findAll({ from: stateName })

    for (const transition of transitionsLeavingState) {
      this.#follow(transition)
    }
  }

  /**
   * The first path found to a state is kept. Cycles end here.
   *
   * @param {Transition} transition - The transition to follow.
   */
  #follow(transition) {
    const isAlreadyReached = this.reaches(transition.toStateName)

    if (isAlreadyReached) {
      return
    }

    const pathBeforeTransition = this.#pathsByStateName.get(transition.fromStateName)
    const pathAfterTransition = [...pathBeforeTransition, transition.eventName]

    this.#recordPath(transition.toStateName, pathAfterTransition)
  }

  /**
   * Records the path and queues the state for a visit.
   *
   * @param {string} stateName - Name of the state reached.
   * @param {string[]} path - The event names that lead there.
   */
  #recordPath(stateName, path) {
    this.#pathsByStateName.set(stateName, path)
    this.#statesToVisit.push(stateName)
  }

  /**
   * Checks that the value is a TransitionRegistry.
   *
   * @param {*} value - The value.
   * @returns {TransitionRegistry} The value.
   */
  #requireTransitionRegistry(value) {
    if (!(value instanceof TransitionRegistry)) {
      throw new TypeError('PathSearch needs a TransitionRegistry.')
    }

    return value
  }
}
