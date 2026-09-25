/**
 * Base class for every error thrown when a rule of your machine is broken.
 * Catching this one catches them all, including kinds added later.
 *
 * A wrong argument type is not one of these. A non-string name or a
 * non-function guard throws the built-in TypeError, because the mistake is
 * in the calling code rather than in the machine.
 */
export class FlowStateError extends Error {
  /**
   * Names the error after its own class, so a log line says which kind it was.
   *
   * @param {string} message - What went wrong, in plain words.
   */
  constructor (message) {
    super(message)

    // Logs the actual class name (e.g., UnknownStateError) instead of "Error".
    this.name = this.constructor.name
  }
}

/**
 * Shared by the errors that are about a single state name. It is not
 * exported, so catch FlowStateError for all of them, or one of the
 * concrete kinds below for a single case.
 */
class StateNameError extends FlowStateError {
  #stateName

  /**
   * The name is given twice, once inside the message for a human reader
   * and once on its own so that code can read it.
   *
   * @param {string} message - What went wrong, in plain words.
   * @param {string} stateName - The state name the error is about.
   */
  constructor (message, stateName) {
    super(message)

    this.#stateName = stateName
  }

  /**
   * The name is kept on its own, so the caller never has to pick the
   * message apart to find it.
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
   * Only the wording belongs here. The base class stores the name.
   *
   * @param {string} stateName - The name that could not be found.
   */
  constructor (stateName) {
    super(`No state named "${stateName}" has been defined.`, stateName)
  }
}

/**
 * Thrown when the same state name is defined twice, since overwriting the
 * first one would silently throw away its hooks.
 */
export class DuplicateStateError extends StateNameError {
  /**
   * Only the wording belongs here. The base class stores the name.
   *
   * @param {string} stateName - The name that was already taken.
   */
  constructor (stateName) {
    super(`A state named "${stateName}" is already defined.`, stateName)
  }
}

/**
 * Thrown when no transition leaves the current state on the event that was sent.
 * Both names are carried, because either one may be perfectly good on its own and
 * only the pair is at fault.
 */
export class NoTransitionError extends FlowStateError {
  #fromStateName
  #eventName

  /**
   * The message names both, so a log line on its own points at the missing edge.
   *
   * @param {string} fromStateName - Name of the state the machine is in.
   * @param {string} eventName - Name of the event that was sent.
   */
  constructor (fromStateName, eventName) {
    super(`No transition from state "${fromStateName}" on event "${eventName}".`)

    this.#fromStateName = fromStateName
    this.#eventName = eventName
  }

  /**
   * The machine is still in this state, since a refused event changes nothing.
   *
   * @returns {string} - Name of the state the machine was in.
   */
  get fromStateName () {
    return this.#fromStateName
  }

  /**
   * This is the name exactly as it was sent, not a cleaned-up form of it.
   *
   * @returns {string} - Name of the event that was sent.
   */
  get eventName () {
    return this.#eventName
  }
}
