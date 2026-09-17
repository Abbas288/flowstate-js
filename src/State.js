/**
 * A single named state in a state machine.
 */
export class State {
  #name
  #onEnter

  /**
   * @param {string} name - Identifies the state within its machine.
   * @param {object} [options]
   * @param {(context: object) => void} [options.onEnter] - Called when this state
   *   becomes the current state, receiving the machine's shared context.
   */
  constructor (name, { onEnter } = {}) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError('State name must be a non-empty string.')
    }

    if (onEnter !== undefined && typeof onEnter !== 'function') {
      throw new TypeError('onEnter must be a function when provided.')
    }

    this.#name = name
    this.#onEnter = onEnter
  }

  /**
   * @returns {string} The name identifying this state.
   */
  get name () {
    return this.#name
  }

  /**
   * Runs this state's onEnter hook, if one was provided.
   *
   * @param {object} context - The state machine's shared context.
   */
  enter (context) {
    if (this.#onEnter !== undefined) {
      this.#onEnter(context)
    }
  }
}
