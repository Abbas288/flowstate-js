/**
 * Reads each history entry back in the shape defineTransition takes, so that toEqual
 * can compare the entries by their names.
 *
 * @param {import('../../src/StateMachine.js').StateMachine} machine - The machine whose history to read.
 * @returns {object[]} One { from, to, on } object per entry, oldest first.
 */
export const recordedMoves = (machine) =>
  machine.history.map((entry) => ({ from: entry.fromStateName, to: entry.toStateName, on: entry.eventName }))
