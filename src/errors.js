/**
 * Base class for every error thrown when a rule of your machine is broken. Catching this
 * catches them all, including kinds added later.
 *
 * Wrong argument types are not these: a non-string name or a non-function guard throws
 * the built-in TypeError, because the mistake is in the calling code, not in the machine.
 */
export class FlowStateError extends Error {
  /**
   * Names the error after its own class, so that a log line says which kind it was.
   *
   * @param {string} message - What went wrong, in plain words.
   */
  constructor (message) {
    super(message)

    this.name = this.constructor.name
  }
}

/**
 * Shared by the errors that are about a single state name. Deliberately not exported:
 * catch FlowStateError to catch everything, or a concrete kind to catch one thing.
 */
class StateNameError extends FlowStateError {
  #stateName

  /**
   * Takes the name twice over, once woven into the message for whoever reads the log and
   * once on its own for whoever writes the catch block.
   *
   * @param {string} message - What went wrong, in plain words.
   * @param {string} stateName - The state name the error is about.
   */
  constructor (message, stateName) {
    super(message)

    this.#stateName = stateName
  }

  /**
   * Tells which name the error is about, so a caller can report it without picking the
   * message apart.
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
   * Words the message. Storing the name is the base class's job.
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
   * Words the message. Storing the name is the base class's job.
   *
   * @param {string} stateName - The name that was already taken.
   */
  constructor (stateName) {
    super(`A state named "${stateName}" is already defined.`, stateName)
  }
}
