import { State } from './State.js'
import { StateRegistry } from './StateRegistry.js'
import { Transition } from './Transition.js'
import { TransitionRegistry } from './TransitionRegistry.js'

/**
 * A machine that is in exactly one state at a time, and that can be asked about the
 * states and transitions it knows.
 */
export class StateMachine {
  #currentStateName
  #states = new StateRegistry()
  #transitions = new TransitionRegistry()

  /**
   * Starts the machine off in a state. The name does not have to be defined yet, so a
   * machine can be built before its states are.
   *
   * @param {string} initialStateName - Name of the state the machine starts in.
   */
  constructor (initialStateName) {
    if (typeof initialStateName !== 'string' || initialStateName.trim() === '') {
      throw new TypeError('Initial state name must be a non-empty string.')
    }

    this.#currentStateName = initialStateName
  }

  /**
   * Tells where the machine is right now. This is the only way to read the current
   * state, and it cannot be written from outside.
   *
   * @returns {string} - Name of the state the machine is in.
   */
  get currentStateName () {
    return this.#currentStateName
  }

  /**
   * Lists the states this machine has been told about, which is not the same as the
   * states it can reach. Defining a state does not connect it to anything.
   *
   * @returns {string[]} - Names of every defined state, in definition order.
   */
  get stateNames () {
    return this.#states.stateNames
  }

  /**
   * Teaches the machine about a state it may rest in. The name and the hooks are checked
   * here, so a bad definition fails at once rather than on the first transition.
   *
   * @param {string} name - Name the state is known by inside this machine.
   * @param {object} [options] - The hooks to run on the way in and out.
   * @param {(context: object) => void} [options.onEnter] - Runs on entering this state.
   * @param {(context: object) => void} [options.onExit] - Runs on leaving this state.
   * @returns {StateMachine} - This machine, so that definitions can be chained.
   */
  defineState (name, options) {
    this.#states.register(new State(name, options))

    return this
  }

  /**
   * Teaches the machine one way to move between states. The named states do not have to
   * be defined yet, so transitions and states can be declared in any order.
   *
   * @param {object} move - The three names that make up the move, plus an optional guard.
   * @param {string} move.from - Name of the state to leave.
   * @param {string} move.to - Name of the state to enter.
   * @param {string} move.on - Name of the triggering event.
   * @param {(context: object) => boolean} [move.guard] - Decides if the move is allowed.
   * @returns {StateMachine} - This machine, so that definitions can be chained.
   */
  defineTransition (move) {
    this.#transitions.register(new Transition(move))

    return this
  }

  /**
   * Lists the events that lead somewhere from a state. Guards are not consulted, so an
   * event may appear here and still be refused at the moment you send it.
   *
   * @param {string} fromStateName - Name of the state to look out from.
   * @returns {string[]} - Names of the events leaving that state, in definition order.
   */
  eventNamesFrom (fromStateName) {
    return this.#transitions
      .transitionsFrom(fromStateName)
      .map((transition) => transition.eventName)
  }
}
