/**
 * Values that every name check must refuse: values that are not strings, the empty
 * string, and a string of spaces.
 */
export const invalidNames = [undefined, null, '', '   ', 42, {}, ['placed']]

/**
 * Values that must be refused as a hook or a guard. undefined is not one of them,
 * because hooks and guards are optional.
 */
export const invalidFunctions = ['not-a-function', 42, {}, null, true]

/**
 * A valid move from placed to paid on pay. Spread it and replace one field to get an
 * invalid move.
 */
export const validPayMove = { from: 'placed', to: 'paid', on: 'pay' }
