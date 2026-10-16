import { StateMachine } from '../../src/StateMachine.js'

/**
 * Makes a new machine with the given states defined. It starts in the first one.
 *
 * @param {string} initialStateName - Name of the state the machine starts in.
 * @param {...string} otherStateNames - Further names to define on it.
 * @returns {StateMachine} A new machine with every name defined.
 */
export const makeMachineWithStates = (initialStateName, ...otherStateNames) => {
  const machine = new StateMachine(initialStateName)
  const allStateNames = [initialStateName, ...otherStateNames]

  for (const stateName of allStateNames) {
    machine.defineState(stateName)
  }

  return machine
}
