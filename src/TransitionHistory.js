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
}
