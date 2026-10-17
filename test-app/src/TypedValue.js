/**
 * The text typed after = in a line such as context.note = 'gift'. A number, true, false or text in quotes
 * can be read as a value.
 */
export class TypedValue {
  #text
  #isValid

  /**
   * Checks the text once, when the object is created.
   *
   * @param {string} text - Such as "250", "true" or "'gift'".
   */
  constructor(text) {
    this.#text = text
    this.#isValid = this.#isNumber() || this.#isBoolean() || this.#isQuoted()
  }

  /**
   * False for anything but a number, true, false or text in quotes.
   *
   * @returns {boolean} True if toValue can be called.
   */
  get isValid() {
    return this.#isValid
  }

  /**
   * Text in quotes comes without its quotes.
   *
   * @returns {number|boolean|string} The value.
   * @throws {TypeError} If the text is not valid.
   */
  toValue() {
    if (!this.#isValid) {
      throw new TypeError(`Not a value: ${this.#text}`)
    }

    if (this.#isNumber()) {
      return Number(this.#text)
    }

    if (this.#text === 'true') {
      return true
    }

    if (this.#text === 'false') {
      return false
    }

    const textWithoutQuotes = this.#text.slice(1, -1)

    return textWithoutQuotes
  }

  /**
   * Number('') is 0, but an empty text is not a number. NaN and Infinity are of type number too, and
   * Number.isFinite rules them out.
   *
   * @returns {boolean} True for a finite number.
   */
  #isNumber() {
    const isEmpty = this.#text === ''
    const number = Number(this.#text)

    return !isEmpty && Number.isFinite(number)
  }

  /**
   * Only the exact words.
   *
   * @returns {boolean} True for true or false.
   */
  #isBoolean() {
    return this.#text === 'true' || this.#text === 'false'
  }

  /**
   * Single or double quotes, the same kind at both ends.
   *
   * @returns {boolean} True for text in quotes.
   */
  #isQuoted() {
    return /^(['"]).*\1$/.test(this.#text)
  }
}
