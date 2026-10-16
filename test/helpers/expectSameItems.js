import { expect } from 'vitest'

/**
 * Checks that the array holds exactly these objects, in this order. toEqual is not
 * enough here. It accepts a copy with the same contents, and it sees all Transitions as
 * equal, because their fields are private.
 *
 * @param {object[]} actual - The array to check.
 * @param {object[]} expected - The objects it should hold.
 */
export const expectSameItems = (actual, expected) => {
  expect(actual).toHaveLength(expected.length)

  expected.forEach((item, index) => {
    expect(actual[index]).toBe(item)
  })
}
