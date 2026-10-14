/**
 * @file Exports the public interface of flowstate-js. StateMachine is the class you
 * work with. The error classes are exported so that you can catch them by type, and
 * FlowStateError is the base class of all of them.
 * @example
 * import { StateMachine, FlowStateError } from 'flowstate-js'
 */
export { StateMachine } from './StateMachine.js'
export * from './errors.js'
