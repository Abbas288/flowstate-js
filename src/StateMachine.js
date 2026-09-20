/**
 * A machine that is in exactly one state at a time, and that can be asked about the
 * states and transitions it knows.
 */
export class StateMachine {
  #currentStateName

  /**
   * Starts the machine off in a state. The name does not have to be defined yet, so a
   * machine can be built before its states are.
   *
   * @param {string} initialStateName - Name of the state the machine starts in.
   */
  constructor (initialStateName) {
    if (typeof initialStateName !== 'string' || initialStateName.trim() === '') {
      throw new TypeError('Initial state name must be a non-empty string.')
    }

    this.#currentStateName = initialStateName
  }

  /**
   * Tells where the machine is right now. This is the only way to read the current
   * state, and it cannot be written from outside.
   *
   * @returns {string} - Name of the state the machine is in.
   */
  get currentStateName () {
    return this.#currentStateName
  }
}
