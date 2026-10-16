/**
 * Converts history entries to plain { from, to, on } objects. Vitest can neither compare nor
 * print HistoryEntry objects, because their fields are private.
 *
 * @param {import('../../src/HistoryEntry.js').HistoryEntry[]} historyEntries - The entries to convert.
 * @returns {object[]} One { from, to, on } object per entry, in the same order.
 */
export const convertToPlainMoves = (historyEntries) =>
  historyEntries.map((entry) => ({ from: entry.fromStateName, to: entry.toStateName, on: entry.eventName }))
