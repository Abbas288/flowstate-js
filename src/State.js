/**
 * A single named state in a state machine.
 */
export class State {
  #name
  #onEnter
  #onExit

  /**
   * Builds a state. Both hooks are optional, and a state without them is simply a name
   * the machine can rest in.
   *
   * @param {string} name - Identifies the state within its machine.
   * @param {object} [options] - The hooks to run on the way in and out.
   * @param {(context: object) => void} [options.onEnter] - Runs on entering this state.
   * @param {(context: object) => void} [options.onExit] - Runs on leaving this state.
   */
  constructor (name, { onEnter, onExit } = {}) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError('State name must be a non-empty string.')
    }

    if (onEnter !== undefined && typeof onEnter !== 'function') {
      throw new TypeError('onEnter must be a function when provided.')
    }

    if (onExit !== undefined && typeof onExit !== 'function') {
      throw new TypeError('onExit must be a function when provided.')
    }

    this.#name = name
    this.#onEnter = onEnter
    this.#onExit = onExit
  }

  /**
   * Tells what this state is called. The name is fixed once the state is built.
   *
   * @returns {string} - The name identifying this state.
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

  /**
   * Runs this state's onExit hook, if one was provided.
   *
   * @param {object} context - The state machine's shared context.
   */
  exit (context) {
    if (this.#onExit !== undefined) {
      this.#onExit(context)
    }
  }
}
