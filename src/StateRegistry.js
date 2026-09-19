import { State } from './State.js'

/**
 * Stores the states belonging to one machine and looks them up by name.
 */
export class StateRegistry {
  #statesByName = new Map()

  /**
   * Stores a state so that it can later be found by its name.
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
   * @param {string} name - The name to look for.
   * @returns {boolean} - True if a state with the given name is registered, false otherwise.
   */
  has (name) {
    return this.#statesByName.has(name)
  }
}
