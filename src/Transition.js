/**
 * One allowed move from one state to another, triggered by a named event.
 */
export class Transition {
  #fromStateName
  #toStateName
  #eventName

  /**
   * @param {object} move
   * @param {string} move.from - Name of the state to leave.
   * @param {string} move.to - Name of the state to enter.
   * @param {string} move.on - Name of the triggering event.
   */
  constructor ({ from, to, on } = {}) {
    this.#requireName(from, 'from')
    this.#requireName(to, 'to')
    this.#requireName(on, 'on')

    this.#fromStateName = from
    this.#toStateName = to
    this.#eventName = on
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
