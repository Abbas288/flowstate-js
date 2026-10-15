import { HistoryEntry } from './HistoryEntry.js'

/**
 * Stores the moves one machine has made, in the order it made them.
 */
export class TransitionHistory {
  #entries = []

  /**
   * Stores an entry after every entry recorded so far.
   *
   * @param {HistoryEntry} entry - The move the machine has just made.
   */
  record(entry) {
    if (!(entry instanceof HistoryEntry)) {
      throw new TypeError('Only HistoryEntry instances can be recorded.')
    }

    this.#entries.push(entry)
  }

  /**
   * Builds a new array on every access, so the caller cannot change the history.
   *
   * @returns {HistoryEntry[]} - Every recorded entry, oldest first.
   */
  get entries() {
    return [...this.#entries]
  }

  /**
   * Gives the newest entry without removing it and without copying the history.
   *
   * @returns {HistoryEntry|undefined} The newest entry, or undefined if the history is empty.
   */
  get newestEntry() {
    return this.#entries.at(-1)
  }

  /**
   * Removes the newest entry from the history and returns it.
   *
   * @returns {HistoryEntry|undefined} - The entry that was removed, or undefined if the history was empty.
   */
  removeNewestEntry() {
    return this.#entries.pop()
  }
}
