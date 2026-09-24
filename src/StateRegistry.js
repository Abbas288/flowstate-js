import { State } from './State.js'

/**
 * Stores the states belonging to one machine and looks them up by name.
 */
export class StateRegistry {
  #statesByName = new Map()

  /**
   * Stores a state under its own name. A repeated name replaces the earlier state.
   *
   * @param {State} state - The state to store.
   */
  register (state) {
    if (!(state instanceof State)) {
      throw new TypeError('Only State instances can be registered.')
    }

    this.#statesByName.set(state.name, state)
  }

  /**
   * The answer comes without fetching the state behind the name.
   *
   * @param {string} name - The name to look for.
   * @returns {boolean} - True if a state with that name is registered.
   */
  has (name) {
    return this.#statesByName.has(name)
  }

  /**
   * A name that is not registered gives undefined, the way Map.get does.
   *
   * @param {string} name - The name to look for.
   * @returns {State|undefined} - The state under that name, or undefined if there is none.
   */
  get (name) {
    return this.#statesByName.get(name)
  }

  /**
   * Builds a new array on every access, so the caller cannot change the registry.
   *
   * @returns {string[]} - Names of every registered state, in registration order.
   */
  get stateNames () {
    return [...this.#statesByName.keys()]
  }
}
