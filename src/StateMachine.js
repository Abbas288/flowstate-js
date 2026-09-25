import { State } from './State.js'
import { StateRegistry } from './StateRegistry.js'
import { Transition } from './Transition.js'
import { TransitionRegistry } from './TransitionRegistry.js'
import { UnknownStateError } from './errors.js'

/**
 * A machine that is in exactly one state at a time, and that can be asked about the
 * states and transitions it knows.
 */
export class StateMachine {
  #currentStateName
  #context = {}
  #states = new StateRegistry()
  #transitions = new TransitionRegistry()

  /**
   * The starting state need not be defined yet, so a state can be
   * defined after the machine that starts in it.
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
   * Only the machine can change its own state, so this name cannot be written.
   *
   * @returns {string} - Name of the state the machine is in.
   */
  get currentStateName () {
    return this.#currentStateName
  }

  /**
   * The object itself is handed out rather than a copy, so that hooks, guards
   * and the caller all write to the same place. Only the reference is fixed.
   *
   * @returns {object} - The context every hook and guard is handed.
   */
  get context () {
    return this.#context
  }

  /**
   * A defined state is not the same as a reachable one, since defining
   * a state connects it to nothing.
   *
   * @returns {string[]} - Names of every defined state, in definition order.
   */
  get stateNames () {
    return this.#states.stateNames
  }

  /**
   * The name and the hooks are checked here, so a bad definition fails at
   * once instead of on the first move. A name can be defined only once.
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
   * Both named states must already be defined, so that the graph can never
   * point at a state that does not exist.
   *
   * @param {object} move - The three names that make up the move, plus an optional guard.
   * @param {string} move.from - Name of the state to leave.
   * @param {string} move.to - Name of the state to enter.
   * @param {string} move.on - Name of the triggering event.
   * @param {(context: object) => boolean} [move.guard] - Decides if the move is allowed.
   * @returns {StateMachine} - This machine, so that definitions can be chained.
   */
  defineTransition (move) {
    const transition = new Transition(move)

    this.#requireDefinedState(transition.fromStateName)
    this.#requireDefinedState(transition.toStateName)

    this.#transitions.register(transition)

    return this
  }

  /**
   * Guards are not consulted, so a listed event may still be refused
   * at the moment it is sent.
   *
   * @param {string} fromStateName - Name of the state to look out from.
   * @returns {string[]} - Names of the events leaving that state, in definition order.
   */
  eventNamesFrom (fromStateName) {
    return this.#transitions
      .transitionsFrom(fromStateName)
      .map((transition) => transition.eventName)
  }

  /**
   * Throws unless a state with that name has been defined on this machine.
   *
   * @param {string} stateName - The name to look for.
   */
  #requireDefinedState (stateName) {
    if (!this.#states.has(stateName)) {
      throw new UnknownStateError(stateName)
    }
  }
}
