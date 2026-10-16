import { HistoryEntry } from './HistoryEntry.js'
import { PathSearch } from './PathSearch.js'
import { State } from './State.js'
import { StateRegistry } from './StateRegistry.js'
import { Transition } from './Transition.js'
import { TransitionHistory } from './TransitionHistory.js'
import { TransitionRegistry } from './TransitionRegistry.js'
import { BlockedTransitionError, DuplicateStateError, NoTransitionError, UnknownStateError } from './errors.js'
import { EventName, StateName } from './names.js'

/**
 * @typedef {import('./errors.js').NoPathError} NoPathError
 */

/**
 * A finite state machine. It is in one state at a time and moves to another state
 * when you send it an event that one of its transitions allows.
 *
 * Every state or event name you pass to the machine must be a non-empty string without
 * whitespace at the start or end. Otherwise the machine throws a TypeError.
 */
export class StateMachine {
  #currentStateName
  #context = {}
  #states = new StateRegistry()
  #transitions = new TransitionRegistry()
  #history = new TransitionHistory()

  /**
   * Creates a machine that starts in the named state. That state can be defined after
   * the machine has been created, but it must be defined before the first event is sent.
   *
   * @param {string} initialStateName - Name of the state the machine starts in.
   */
  constructor(initialStateName) {
    this.#currentStateName = new StateName(initialStateName).text
  }

  /**
   * Gets the name of the state the machine is in. It changes only when the machine moves, and it
   * cannot be set from outside.
   *
   * @returns {string} Name of the state the machine is in.
   */
  get currentStateName() {
    return this.#currentStateName
  }

  /**
   * Gets the object that holds your own data for guards and hooks. Every guard and hook
   * receives this same object. The object cannot be replaced.
   *
   * @returns {object} The context every hook and guard is handed.
   */
  get context() {
    return this.#context
  }

  /**
   * Gets the names of the states defined so far, in a new array each time.
   *
   * @returns {string[]} Names of every defined state, in definition order.
   */
  get stateNames() {
    return this.#states.stateNames
  }

  /**
   * Gets the moves the machine has made, oldest first, in a new array each time.
   *
   * @returns {HistoryEntry[]} Every move the machine has made, oldest first.
   */
  get history() {
    return this.#history.entries
  }

  /**
   * Adds a state the machine can be in. onEnter runs each time the machine enters the
   * state, and onExit each time it leaves it.
   *
   * @param {string} name - Name the state is known by inside this machine.
   * @param {object} [options] - The hooks to run on the way in and out.
   * @param {(context: object) => void} [options.onEnter] - Runs on entering this state.
   * @param {(context: object) => void} [options.onExit] - Runs on leaving this state.
   * @returns {StateMachine} This machine, for chaining.
   * @throws {TypeError} If a hook is not a function.
   * @throws {DuplicateStateError} If a state with the name is already defined.
   */
  defineState(name, options) {
    this.#states.register(new State(name, options))

    return this
  }

  /**
   * Lets an event move the machine from one state to another. If a guard is given, the
   * move happens only when the guard returns a truthy value.
   *
   * @param {object} move - The three names that make up the move, plus an optional guard.
   * @param {string} move.from - Name of the state to leave.
   * @param {string} move.to - Name of the state to enter.
   * @param {string} move.on - Name of the triggering event.
   * @param {(context: object) => boolean} [move.guard] - Decides if the move is allowed.
   * @returns {StateMachine} This machine, for chaining.
   * @throws {TypeError} If the guard is not a function.
   * @throws {UnknownStateError} If the from state or the to state has not been defined.
   */
  defineTransition(move) {
    const transition = new Transition(move)

    this.#requireBothStatesDefined(transition)
    this.#transitions.register(transition)

    return this
  }

  /**
   * Moves the machine along the first transition on the event whose guard allows it.
   * Runs onExit of the current state, then changes the current state and records the move, then runs
   * onEnter of the new one.
   *
   * @param {string} eventName - Name of the event to send.
   * @throws {UnknownStateError} If the starting state has not been defined yet.
   * @throws {NoTransitionError} If no transition leaves the current state on the event.
   * @throws {BlockedTransitionError} If such transitions exist, but every guard refuses the move.
   * @throws {*} Any error that a guard or a hook throws, passed on unchanged.
   */
  send(eventName) {
    this.#requireReadyToSend(eventName)

    const transition = this.#chooseTransition(eventName)

    this.#moveAlongWithHooks(transition)
  }

  /**
   * Tells whether send would move the machine now, without moving it. Guards are asked
   * but no hook runs.
   *
   * @param {string} eventName - Name of the event to ask about.
   * @returns {boolean} True if send would move the machine now, false if send would refuse the event.
   * @throws {UnknownStateError} If the starting state has not been defined yet.
   * @throws {*} Any error that a guard throws, passed on unchanged.
   */
  canSend(eventName) {
    this.#requireReadyToSend(eventName)

    return this.#findAllowedTransition(eventName) !== undefined
  }

  /**
   * Moves the machine back to the state it left on its last move, or does nothing if the
   * history is empty. No guard is asked and the context is not restored. Runs the exit hook,
   * then changes the current state and removes the move from the history, then runs the enter hook.
   *
   * @throws {*} Any error that a hook throws, passed on unchanged.
   */
  undoLastMove() {
    const lastMove = this.#history.newestEntry

    if (lastMove === undefined) {
      return
    }

    this.#moveBackAlongWithHooks(lastMove)
  }

  /**
   * Lists the events that have a transition out of the state, even those a guard would block right now.
   *
   * @param {string} fromStateName - Name of the state to look out from.
   * @returns {string[]} Names of the events leaving that state, each once, in the order first defined.
   * @throws {UnknownStateError} If the state has not been defined.
   */
  listEventNamesFrom(fromStateName) {
    this.#requireDefinedState(new StateName(fromStateName).text)

    const eventNames = this.#transitions.findAll({ from: fromStateName }).map((transition) => transition.eventName)

    return [...new Set(eventNames)]
  }

  /**
   * Lists the events that have a transition out of the state, exactly like listEventNamesFrom.
   *
   * @deprecated Use listEventNamesFrom instead.
   * @param {string} fromStateName - Name of the state to look out from.
   * @returns {string[]} Names of the events leaving that state, each once, in the order first defined.
   * @throws {UnknownStateError} If the state has not been defined.
   */
  eventNamesFrom(fromStateName) {
    return this.listEventNamesFrom(fromStateName)
  }

  /**
   * Tells whether a chain of events leads from the current state to the state. Guards are not
   * asked.
   *
   * @param {string} stateName - Name of the state to reach.
   * @returns {boolean} True if findPathTo would find a chain, false if it would throw a NoPathError.
   * @throws {UnknownStateError} If that state, or the state the machine is in, has not been defined.
   */
  canReach(stateName) {
    this.#requireReadyToSearch(stateName)

    const searchFromCurrentState = new PathSearch(this.#transitions, this.#currentStateName)

    return searchFromCurrentState.reaches(stateName)
  }

  /**
   * Finds the shortest chain of events from the current state to the state. Nothing is sent and
   * guards are not asked. Ties go to the transitions defined first.
   *
   * @param {string} stateName - Name of the state to reach.
   * @returns {string[]} The event names in sending order, in a new array each time. Empty if the
   *   machine is already in that state.
   * @throws {UnknownStateError} If that state, or the state the machine is in, has not been defined.
   * @throws {NoPathError} If no chain of events leads there.
   */
  findPathTo(stateName) {
    this.#requireReadyToSearch(stateName)

    const searchFromCurrentState = new PathSearch(this.#transitions, this.#currentStateName)

    return searchFromCurrentState.pathTo(stateName)
  }

  /**
   * Checks both ends of the transition.
   *
   * @param {Transition} transition - The transition.
   */
  #requireBothStatesDefined(transition) {
    this.#requireDefinedState(transition.fromStateName)
    this.#requireDefinedState(transition.toStateName)
  }

  /**
   * Checks the event name and the current state. Creating an EventName checks the name; the
   * object is not kept.
   *
   * @param {*} eventName - The value to check.
   */
  #requireReadyToSend(eventName) {
    new EventName(eventName)
    this.#requireDefinedState(this.#currentStateName)
  }

  /**
   * Checks the target and the current state.
   *
   * @param {*} stateName - The value to check.
   */
  #requireReadyToSearch(stateName) {
    this.#requireDefinedState(new StateName(stateName).text)
    this.#requireDefinedState(this.#currentStateName)
  }

  /**
   * Checks that the state is defined.
   *
   * @param {string} stateName - The name.
   */
  #requireDefinedState(stateName) {
    if (!this.#states.has(stateName)) {
      throw new UnknownStateError(stateName)
    }
  }

  /**
   * Chooses the transition the machine moves along, or throws an error that says why the event is refused.
   *
   * @param {string} eventName - The event.
   * @returns {Transition} The transition.
   */
  #chooseTransition(eventName) {
    return this.#findAllowedTransition(eventName) ?? this.#throwRefusedEventError(eventName)
  }

  /**
   * Finds the first candidate whose guard allows the move.
   *
   * @param {string} eventName - The event.
   * @returns {Transition|undefined} The transition, if any.
   */
  #findAllowedTransition(eventName) {
    return this.#candidatesFor(eventName).find((candidate) => candidate.isAllowedIn(this.#context))
  }

  /**
   * When every guard refuses, the error names only the first candidate.
   *
   * @param {string} eventName - The event.
   */
  #throwRefusedEventError(eventName) {
    const candidates = this.#candidatesFor(eventName)

    if (candidates.length === 0) {
      throw new NoTransitionError(this.#currentStateName, eventName)
    }

    const firstBlocked = candidates[0]

    throw new BlockedTransitionError(firstBlocked)
  }

  /**
   * Guards are not asked here.
   *
   * @param {string} eventName - The event.
   * @returns {Transition[]} The candidates, in definition order.
   */
  #candidatesFor(eventName) {
    return this.#transitions.findAll({ from: this.#currentStateName, on: eventName })
  }

  /**
   * Records the move before onEnter runs. If onEnter throws, the machine stays in the new state,
   * and the move is already in the history.
   *
   * @param {Transition} transition - The transition to take.
   */
  #moveAlongWithHooks(transition) {
    const fromState = this.#states.get(transition.fromStateName)
    const toState = this.#states.get(transition.toStateName)

    fromState.exit(this.#context)
    this.#currentStateName = toState.name
    this.#history.record(new HistoryEntry(transition))
    toState.enter(this.#context)
  }

  /**
   * Removes the move before onEnter runs. If onEnter throws, the machine stays in the state it
   * moved back to, and the move is already gone from the history.
   *
   * @param {HistoryEntry} lastMove - The newest entry in the history.
   */
  #moveBackAlongWithHooks(lastMove) {
    const fromState = this.#states.get(lastMove.toStateName)
    const toState = this.#states.get(lastMove.fromStateName)

    fromState.exit(this.#context)
    this.#currentStateName = toState.name
    this.#history.removeNewestEntry()
    toState.enter(this.#context)
  }
}
