/**
 * One allowed move from one state to another, triggered by a named event.
 */
export class Transition {
  #fromStateName
  #toStateName
  #eventName
  #guard

  /**
   * @param {object} move
   * @param {string} move.from - Name of the state to leave.
   * @param {string} move.to - Name of the state to enter.
   * @param {string} move.on - Name of the triggering event.
   * @param {(context: object) => boolean} [move.guard] - Decides if the move is allowed.
   */
  constructor ({ from, to, on, guard } = {}) {
    this.#requireName(from, 'from')
    this.#requireName(to, 'to')
    this.#requireName(on, 'on')

    if (guard !== undefined && typeof guard !== 'function') {
      throw new TypeError('Transition guard must be a function when provided.')
    }

    this.#fromStateName = from
    this.#toStateName = to
    this.#eventName = on
    this.#guard = guard
  }

  /**
   * @returns {string} - Name of the state this transition leaves.
   */
  get fromStateName () {
    return this.#fromStateName
  }

  /**
   * @returns {string} - Name of the state this transition enters.
   */
  get toStateName () {
    return this.#toStateName
  }

  /**
   * @returns {string} - Name of the event that triggers this transition.
   */
  get eventName () {
    return this.#eventName
  }

  /**
   * @param {string} eventName - Name of the event to test.
   * @returns {boolean} - True if that event triggers this transition.
   */
  isTriggeredBy (eventName) {
    return this.#eventName === eventName
  }

  /**
   * @param {object} context - The state machine's shared context.
   * @returns {boolean} - True if this transition is allowed to run right now.
   */
  isAllowedIn (context) {
    if (this.#guard === undefined) {
      return true
    }

    return Boolean(this.#guard(context))
  }

  /**
   * Throws unless the value can be used as a name.
   *
   * @param {*} value
   * @param {string} label - Field name, used in the error message.
   */
  #requireName (value, label) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(`Transition ${label} must be a non-empty string.`)
    }
  }
}
