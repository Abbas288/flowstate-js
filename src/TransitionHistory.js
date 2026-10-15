import { HistoryEntry } from './HistoryEntry.js'

/**
 * Stores the moves one machine has made, in the order it made them.
 */
export class TransitionHistory {
  #entries = []

  /**
   * Adds an entry after the ones recorded so far.
   *
   * @param {HistoryEntry} entry - The move the machine has just made.
   * @throws {TypeError} If the value is not a HistoryEntry.
   */
  record(entry) {
    if (!(entry instanceof HistoryEntry)) {
      throw new TypeError('Only HistoryEntry instances can be recorded.')
    }

    this.#entries.push(entry)
  }

  /**
   * Gets every recorded entry, oldest first. The array is a copy, so changing it does not
   * change the history.
   *
   * @returns {HistoryEntry[]} Every recorded entry, oldest first.
   */
  get entries() {
    return [...this.#entries]
  }

  /**
   * Gets the newest entry without removing it, and without copying the history.
   *
   * @returns {HistoryEntry|undefined} The newest entry, or undefined if the history is empty.
   */
  get newestEntry() {
    return this.#entries.at(-1)
  }

  /**
   * Removes the newest entry from the history and returns it.
   *
   * @returns {HistoryEntry|undefined} The entry that was removed, or undefined if the history was empty.
   */
  removeNewestEntry() {
    return this.#entries.pop()
  }
}
