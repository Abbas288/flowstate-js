/**
 * Base class for every error thrown when a rule of your machine is broken. Catching this
 * catches them all, including kinds added later.
 *
 * Wrong argument types are not these: a non-string name or a non-function guard throws
 * the built-in TypeError, because the mistake is in the calling code, not in the machine.
 */
export class FlowStateError extends Error {
  /**
   * Names the error after its own class, so a log line says which kind it was.
   *
   * @param {string} message - What went wrong, in plain words.
   */
  constructor (message) {
    super(message)

    this.name = this.constructor.name
  }
}

/**
 * Shared by the errors about a single state name. Not exported: catch FlowStateError for
 * all of them, or a concrete kind for one.
 */
class StateNameError extends FlowStateError {
  #stateName

  /**
   * Takes the name twice: inside the message for humans, on its own for code.
   *
   * @param {string} message - What went wrong, in plain words.
   * @param {string} stateName - The state name the error is about.
   */
  constructor (message, stateName) {
    super(message)

    this.#stateName = stateName
  }

  /**
   * Saves the caller from picking the message apart.
   *
   * @returns {string} - The state name the error is about.
   */
  get stateName () {
    return this.#stateName
  }
}

/**
 * Thrown when a state name is used that was never defined.
 */
export class UnknownStateError extends StateNameError {
  /**
   * Words the message; storing the name is the base class's job.
   *
   * @param {string} stateName - The name that could not be found.
   */
  constructor (stateName) {
    super(`No state named "${stateName}" has been defined.`, stateName)
  }
}

/**
 * Thrown when the same state name is defined twice. Overwriting the first one would throw
 * away its hooks without a word.
 */
export class DuplicateStateError extends StateNameError {
  /**
   * Words the message; storing the name is the base class's job.
   *
   * @param {string} stateName - The name that was already taken.
   */
  constructor (stateName) {
    super(`A state named "${stateName}" is already defined.`, stateName)
  }
}
