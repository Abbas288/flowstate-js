# Test-App

A console app for trying flowstate-js by hand. It runs one order:

```text
placed --pay--> paid --ship--> shipped --deliver--> delivered
placed, paid --cancel--> cancelled
```

`pay` has a guard: `context.amount` must be above 50.

## Start

```bash
npm install
npm start
```

Stop with `quit` or Ctrl-C.

## The screen

In a terminal, the list of commands stays at the top, and your last command and its result are below it. Output
to a file or a pipe gets the list once.

The prompt shows the state and the events out of it: `placed [pay, cancel]>`. `[end state]` means no way out.

| Line                        | Comes from                       |
| --------------------------- | -------------------------------- |
| `order.send('pay')`         | the call to flowstate-js         |
| `returned …`, `completed …` | what the call returned           |
| `threw …`                   | what the call threw              |
| `[hook] …`                  | a hook the Test-App gave a state |
| `[test-app] …`              | the Test-App itself              |
| `[deprecated] …`            | a v1 name that still works       |

## Try every function

Type one line at a time. Each step goes on from the one before.

| #   | Type                                         | Expect                                                        |
| --- | -------------------------------------------- | ------------------------------------------------------------- |
| 1   | `currentStateName`                           | `returned 'placed'`                                           |
| 2   | `stateNames`                                 | the five states                                               |
| 3   | `send pay`                                   | `threw BlockedTransitionError`: the amount is 0, not above 50 |
| 4   | `canSend pay`                                | `returned false`                                              |
| 5   | `context.amount = 250`, then `context`       | `returned { amount: 250 }`                                    |
| 6   | `canSend pay`                                | `returned true`, and no hook runs                             |
| 7   | `send pay`                                   | `onExit of placed`, `onEnter of paid`                         |
| 8   | `send deliver`                               | `threw NoTransitionError`                                     |
| 9   | `listEventNamesFrom`                         | `[ 'ship', 'cancel' ]`                                        |
| 10  | `eventNamesFrom paid`                        | the same, and a `[deprecated]` line                           |
| 11  | `listEventNamesFrom lost`                    | `threw UnknownStateError`                                     |
| 12  | `canReach delivered`, `findPathTo delivered` | `true`, then `[ 'ship', 'deliver' ]`                          |
| 13  | `send ship`, `send deliver`                  | the prompt shows `delivered [end state]`                      |
| 14  | `history`                                    | three moves, oldest first                                     |
| 15  | `undoLastMove`, then `history`               | back in `shipped`, with two moves                             |
| 16  | `reset`, `send cancel`                       | `cancelled [end state]`                                       |
| 17  | `canReach delivered`, `findPathTo delivered` | `false`, then `threw NoPathError`                             |
| 18  | `reset`, `undoLastMove`                      | `completed`: nothing to undo                                  |
| 19  | `send`, `foo`, `context.note = gift`         | only `[test-app]` lines, no call                              |

## The code

The code is in [`src/`](src/), split as model, view and controller:

| File                 | Part       | Does                                         |
| -------------------- | ---------- | -------------------------------------------- |
| `app.js`             | start      | puts the parts together and starts the app   |
| `OrderModel.js`      | model      | the order: its states, transitions and guard |
| `OrderView.js`       | view       | all input and output                         |
| `OrderController.js` | controller | the commands, and what happens on an error   |
| `TypedValue.js`      | input      | reads the value after `=` in `context.x = 1` |

## Not tested

> **Note:** The Test-App is kept small on purpose. Because of limited time, a bigger Test-App was out of scope.

- The Test-App has no automated tests of its own. The steps above check it by hand.
- It runs one fixed order, so these cases cannot happen in it. The unit tests in [`../test/`](../test/) cover them:
  - your own states and transitions ([`defineState`](../test/StateMachine/defineState.test.js),
    [`defineTransition`](../test/StateMachine/defineTransition.test.js))
  - a state name used twice, `DuplicateStateError` ([`defineState`](../test/StateMachine/defineState.test.js))
  - a bad name, `TypeError` ([`names`](../test/names.test.js))
  - two transitions on one event ([`send`](../test/StateMachine/send.test.js))
  - a guard or a hook that throws ([`send`](../test/StateMachine/send.test.js))
