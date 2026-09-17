/**
 * A single named state in a state machine.
 */
export class State {
  #name

  /**
   * @param {string} name - Identifies the state within its machine.
   */
  constructor (name) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError('State name must be a non-empty string.')
    }

    this.#name = name
  }

  /**
   * @returns {string} The name identifying this state.
   */
  get name () {
    return this.#name
  }
}
