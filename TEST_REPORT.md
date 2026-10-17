# Test Report

This report describes how flowstate-js was tested and what the results were.

## Summary

The module is tested in two ways:

1. **Automated unit tests** with [Vitest](https://vitest.dev/): 291 tests in 19 files in [`test/`](test/). They
   cover every public method and property of `StateMachine`, the error classes, the exports of `src/index.js`, and
   the internal classes on their own. Each test checks one behaviour, and its name says which. Together they cover
   100% of the statements, branches, functions and lines in `src/`.
2. **The Test-App** in [`test-app/`](test-app/), a console app that moves an order through the module. It is tested
   by hand: the [manual tests](#manual-tests-test-app) are the tour in [`test-app/README.md`](test-app/README.md).

The unit tests are the main method. They are repeatable, and they reach cases that are hard to set up by hand, such
as a guard that returns `NaN` or a hook that throws. The Test-App imports the module by its package name, through
the `exports` in `package.json`, as a user does. It links the whole project folder (`file:..`), so it does not
check which files a user who installs from GitHub gets (`"files"` in `package.json`).

### Run the unit tests

```bash
git clone https://github.com/Abbas288/flowstate-js.git
cd flowstate-js
npm install
npm test
```

To see the name of every test, run `npm run test:verbose`.

To measure the coverage, run `npm run test:coverage`. It prints a summary and writes the full report to `coverage/`.

Vitest 5 needs Node.js 22.12 or later. To run the unit tests on Node.js 18 or 20, which the module also supports,
use Vitest 2 through `npx`. Nothing is installed in the project:

```bash
npx -p node@18 -p vitest@2.1.9 vitest run
```

### Run the manual tests

```bash
cd test-app
npm install
npm start
```

Type the commands of the tour one per line. You can also pipe them in, which is how they were run for this report.
In PowerShell, each string becomes one line:

```powershell
"context.amount = 250", "canSend pay", "send pay" | npm start
```

### Test environment

| Item    | Value                                                                                                                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commit  | `src/` and `test/` as in `ade729a`. The Test-App as in the commit that has this report.                                                                                                                                         |
| Date    | 2026-10-17                                                                                                                                                                                                                      |
| OS      | Windows 11 Home                                                                                                                                                                                                                 |
| Shell   | Git Bash for the manual tests (2026-10-17)                                                                                                                                                                                      |
| Node.js | v22.23.2 for every run in this report. On GitHub, CI run 38934816969 for `ade729a` (2026-10-16) passed on all four jobs: format, lint and test on Node.js 22 and 24, and the unit tests with Vitest 2.1.9 on Node.js 18 and 20. |
| npm     | 11.12.0                                                                                                                                                                                                                         |
| Vitest  | 5.0.1, with `@vitest/coverage-v8` 5.0.1 for the coverage                                                                                                                                                                        |

## Test Results

### Unit tests

**291 of 291 passed.** The coverage of `src/` is 100% for statements (182), branches (47), functions (83) and
lines (178). `src/index.js` shows `0`, since it only re-exports and has
nothing to count.

Each row in the table is one group of tests, run with Vitest. The second column names the test file. The name of every test is
in [All unit tests](#all-unit-tests).

| What was tested                                                                                                                                                                                                                                                                                                                                 | How it was tested                                               | Result   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------- |
| `new StateMachine(initialStateName)`: starts in the given state, even one that is not defined yet. Rejects a bad name with `TypeError`. Each machine keeps its own state.                                                                                                                                                                       | `constructor.test.js`, `constructor`                            | ✅ 5/5   |
| `currentStateName`: cannot be written from outside. Assigning a value to it throws `TypeError`, and the state stays the same.                                                                                                                                                                                                                   | `constructor.test.js`, `currentStateName`                       | ✅ 1/1   |
| `context`: starts empty, keeps what is written into it, stays the same object, cannot be replaced, and is separate for each machine.                                                                                                                                                                                                            | `constructor.test.js`, `context`                                | ✅ 5/5   |
| `defineState(name, options)`: chains, and hooks are optional. Throws `TypeError` for a bad name or hook, and `DuplicateStateError` for a name defined twice, without listing it twice. Leaves the current state unchanged.                                                                                                                      | `defineState.test.js`, `defineState`                            | ✅ 8/8   |
| `stateNames`: empty at first, then in definition order. The returned list cannot change the machine.                                                                                                                                                                                                                                            | `defineState.test.js`, `stateNames`                             | ✅ 3/3   |
| `defineTransition(move)`: chains, and accepts a guard and a move back to the same state. Throws `TypeError` for a bad `from`, `to`, `on` or guard, or no move, and only then `UnknownStateError` for an undefined state. Keeps nothing it refuses.                                                                                              | `defineTransition.test.js`, `defineTransition`                  | ✅ 13/13 |
| `listEventNamesFrom(stateName)`: lists the events out of that state only, in definition order and once each, even when a guard refuses. Gives `[]` for a state with no way out. Throws `UnknownStateError` and `TypeError`. The returned list cannot change the machine.                                                                        | `defineTransition.test.js`, `listEventNamesFrom`                | ✅ 10/10 |
| `eventNamesFrom(stateName)`, the deprecated v1 name: the same ten tests, run against the old name.                                                                                                                                                                                                                                              | `defineTransition.test.js`, `eventNamesFrom`                    | ✅ 10/10 |
| `send(eventName)`, moving: follows the transition out of the current state, several times in a row and back to the same state. Returns nothing.                                                                                                                                                                                                 | `send.test.js`                                                  | ✅ 5/5   |
| `send(eventName)`, refusing: throws `NoTransitionError` with both names and stays in its state. Throws `TypeError` for a bad name, and `UnknownStateError` if the initial state was never defined.                                                                                                                                              | `send.test.js`                                                  | ✅ 6/6   |
| `send(eventName)`, guards: moves when the guard allows it. When it refuses, throws `BlockedTransitionError`, stays and runs no hook. The guard gets the context, runs before the exit hook, and can allow a later `send`. A guard that throws leaves the state unchanged.                                                                       | `send.test.js`                                                  | ✅ 8/8   |
| `send(eventName)`, several transitions on one event: takes the first one its guard allows, and asks no later guard. When all refuse, it asks each guard once and names the first transition in the error.                                                                                                                                       | `send.test.js`                                                  | ✅ 5/5   |
| `send(eventName)`, hooks: runs `onExit`, changes the state, then runs `onEnter`, each with the context. Runs both on a move back to the same state, and none on a refusal. If `onExit` throws, the state is unchanged. If `onEnter` throws, it has already changed.                                                                             | `send.test.js`                                                  | ✅ 7/7   |
| `canSend(eventName)`: answers `true` or `false` as `send` would decide, and the answer changes with the context. Does not move or run hooks. Throws `TypeError` and `UnknownStateError`, and passes on a guard's error.                                                                                                                         | `canSend.test.js`                                               | ✅ 12/12 |
| `history`: empty at first, then each move oldest first, with the transition whose guard allowed it. No move is recorded when `send` refuses, when the exit hook throws, or for `canSend`. The move is recorded when the enter hook throws. The returned list cannot change the history.                                                         | `history.test.js`                                               | ✅ 9/9   |
| `undoLastMove()`: moves back along the last move and removes it, one move per call, without asking the guard. Does nothing, and returns nothing, when there is no move. Runs the exit hook, then the enter hook, and does not undo the context. If the exit hook throws, nothing changes. If the enter hook throws, the move is already undone. | `undoLastMove.test.js`                                          | ✅ 10/10 |
| `canReach(stateName)`: `true` when a chain of events leads there, also for the current state, `false` when none does. Does not ask the guards. Throws `UnknownStateError`, also for a starting state that was never defined, and `TypeError`.                                                                                                   | `canReach.test.js`                                              | ✅ 7/7   |
| `findPathTo(stateName)`: the shortest chain of events, `[]` for the current state, and `NoPathError` with both names when no chain leads there. Does not ask the guards, move the machine or run a hook. Throws `UnknownStateError` and `TypeError`. The returned list cannot change the machine.                                               | `findPathTo.test.js`                                            | ✅ 9/9   |
| `FlowStateError`: an `Error` but not a `TypeError`, named after its class, with a stack trace.                                                                                                                                                                                                                                                  | `errors.test.js`, `FlowStateError`                              | ✅ 4/4   |
| `UnknownStateError`, `DuplicateStateError`: extend `FlowStateError`, name the state in the message, and have a read-only `stateName`.                                                                                                                                                                                                           | `errors.test.js`, `UnknownStateError`, `DuplicateStateError`    | ✅ 12/12 |
| `NoTransitionError`, `BlockedTransitionError`: extend `FlowStateError`, name the state and event in the message, and have read-only `fromStateName` and `eventName`. `BlockedTransitionError` also has `toStateName`.                                                                                                                           | `errors.test.js`, `NoTransitionError`, `BlockedTransitionError` | ✅ 18/18 |
| `NoPathError`: extends `FlowStateError` but is not about a refused event. Names both states in the message, and has read-only `fromStateName` and `toStateName`.                                                                                                                                                                                | `errors.test.js`, `NoPathError`                                 | ✅ 6/6   |
| All error classes: `errors.js` exports these six and nothing else, one `catch` handles them all, and each is told apart from the others.                                                                                                                                                                                                        | `errors.test.js`, `the error family`                            | ✅ 5/5   |
| `src/index.js`: exports `StateMachine` and the error classes, and nothing else.                                                                                                                                                                                                                                                                 | `index.test.js`                                                 | ✅ 2/2   |
| Internal `StateName`, `EventName`: reject anything but a non-empty string without whitespace at the start or end.                                                                                                                                                                                                                               | `names.test.js`                                                 | ✅ 13/13 |
| Internal `State`: runs its hooks with the context, and rejects hooks that are not functions.                                                                                                                                                                                                                                                    | `State.test.js`                                                 | ✅ 9/9   |
| Internal `Transition`: checks its fields, matches its event by exact name, and treats the guard's answer as truthy or falsy.                                                                                                                                                                                                                    | `Transition.test.js`                                            | ✅ 28/28 |
| Internal `StateRegistry`: finds states by name, and refuses a duplicate while keeping the first.                                                                                                                                                                                                                                                | `StateRegistry.test.js`                                         | ✅ 14/14 |
| Internal `TransitionRegistry`: finds transitions by state and event, in registration order.                                                                                                                                                                                                                                                     | `TransitionRegistry.test.js`                                    | ✅ 17/17 |
| Internal `PathSearch`: a breadth-first search that finds the shortest chain, or the one defined first among equally short ones, ends in a graph with a cycle, does not ask the guards, and hands out a copy of the path.                                                                                                                        | `PathSearch.test.js`                                            | ✅ 14/14 |
| Internal `HistoryEntry`: keeps the two state names and the event of a move, and cannot be changed.                                                                                                                                                                                                                                              | `HistoryEntry.test.js`                                          | ✅ 5/5   |
| Internal `TransitionHistory`: records entries oldest first, hands out a copy, and gives or removes the newest entry.                                                                                                                                                                                                                            | `TransitionHistory.test.js`                                     | ✅ 11/11 |

### Manual tests (Test-App)

**Every step of the tour passed**, 2026-10-17, with the commands piped in from Git Bash. The steps and their expected
results are the tour in [`test-app/README.md`](test-app/README.md#try-every-function). They try every public method
and property of `StateMachine`, and `UnknownStateError`, `NoTransitionError`, `BlockedTransitionError` and
`NoPathError`.

### Not tested

- Operating systems other than Windows 11.
- Browsers.
- The Test-App's own code has no automated tests. Because of limited time, a bigger Test-App was out of scope. The
  tour checks it by hand.
- Names with whitespace at the start or end in the Test-App, since the app removes that whitespace. `names.test.js`
  covers them.
- In the Test-App: defining states and transitions, `DuplicateStateError`, a `TypeError` for a bad name, choosing
  between several transitions on one event, and a guard or hook that throws. It runs one fixed order. The unit
  tests cover all of them.
- An event name with quotes or a comma typed into the Test-App, such as `send "pay"`. It reaches the module as it
  is, and the module answers with `NoTransitionError`.
- Typing into a real terminal. The commands were piped in, so line editing, Ctrl-C and ending the input from the
  keyboard were not checked.
- That a user who installs from GitHub gets every file the module needs. The Test-App links the whole project folder.

### All unit tests

<details>
<summary>The 291 test names, file by file, as <code>npm run test:verbose</code> prints them (without the times)</summary>

```text
✓ test/HistoryEntry.test.js > HistoryEntry > records the state the machine left, the state it entered and the event that was sent
✓ test/HistoryEntry.test.js > HistoryEntry > rejects values that are not transitions
✓ test/HistoryEntry.test.js > HistoryEntry > throws a TypeError instead of changing its fromStateName
✓ test/HistoryEntry.test.js > HistoryEntry > throws a TypeError instead of changing its toStateName
✓ test/HistoryEntry.test.js > HistoryEntry > throws a TypeError instead of changing its eventName
✓ test/PathSearch.test.js > PathSearch > finds the event that leads straight to a neighbour
✓ test/PathSearch.test.js > PathSearch > finds a chain of events across several states
✓ test/PathSearch.test.js > PathSearch > finds the shortest chain when a longer one was defined first
✓ test/PathSearch.test.js > PathSearch > finds the shortest chain when a longer one also leads there
✓ test/PathSearch.test.js > PathSearch > picks the chain defined first when two are equally short
✓ test/PathSearch.test.js > PathSearch > gives an empty chain to the start state
✓ test/PathSearch.test.js > PathSearch > throws a NoPathError naming both states when no chain leads to the state
✓ test/PathSearch.test.js > PathSearch > ends its search in a graph with a cycle
✓ test/PathSearch.test.js > PathSearch > finds a chain through a cycle
✓ test/PathSearch.test.js > PathSearch > does not ask the guards
✓ test/PathSearch.test.js > PathSearch > tells whether a chain leads to the state
✓ test/PathSearch.test.js > PathSearch > reaches the start state
✓ test/PathSearch.test.js > PathSearch > cannot be changed through the path it returns
✓ test/PathSearch.test.js > PathSearch > rejects transitions that are not a transition registry
✓ test/State.test.js > State > exposes the name it was given
✓ test/State.test.js > State > rejects a name that is not a non-empty string
✓ test/State.test.js > State > runs its onEnter hook with the shared context
✓ test/State.test.js > State > does nothing when entered without an onEnter hook
✓ test/State.test.js > State > rejects an onEnter that is not a function
✓ test/State.test.js > State > runs its onExit hook with the shared context
✓ test/State.test.js > State > does nothing when exited without an onExit hook
✓ test/State.test.js > State > keeps onEnter and onExit independent of each other
✓ test/State.test.js > State > rejects an onExit that is not a function
✓ test/StateMachine/canReach.test.js > StateMachine > canReach > answers true when a chain of events leads to the state
✓ test/StateMachine/canReach.test.js > StateMachine > canReach > answers false when no chain of events leads to the state
✓ test/StateMachine/canReach.test.js > StateMachine > canReach > answers true for the state the machine is in
✓ test/StateMachine/canReach.test.js > StateMachine > canReach > does not ask the guards
✓ test/StateMachine/canReach.test.js > StateMachine > canReach > throws an UnknownStateError for a state that was never defined
✓ test/StateMachine/canReach.test.js > StateMachine > canReach > throws an UnknownStateError instead of returning false when the starting state was never defined
✓ test/StateMachine/canReach.test.js > StateMachine > canReach > throws a TypeError when the state name is not a non-empty string
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > answers true for an event that would move the machine
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > answers false for an event that has no transition from the current state
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > answers false when the guard blocks the transition
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > answers true when a later transition on the event is allowed
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > changes its answer when the context changes
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > does not move the machine when it answers true
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > runs no hook
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > passes its own context object to the guard
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > does not ask a later guard once an earlier one allows the move
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > throws a TypeError when the event name is not a non-empty string
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > throws an UnknownStateError instead of returning false when the starting state was never defined
✓ test/StateMachine/canSend.test.js > StateMachine > canSend > passes on an error that the guard throws, instead of answering false
✓ test/StateMachine/constructor.test.js > StateMachine > constructor > starts in the state it was given
✓ test/StateMachine/constructor.test.js > StateMachine > constructor > rejects an initial state name that is not a non-empty string
✓ test/StateMachine/constructor.test.js > StateMachine > constructor > says in the error message that the state name was wrong
✓ test/StateMachine/constructor.test.js > StateMachine > constructor > keeps machines independent of each other
✓ test/StateMachine/constructor.test.js > StateMachine > constructor > accepts a starting state that is not defined yet
✓ test/StateMachine/constructor.test.js > StateMachine > currentStateName > does not let the current state be written from outside
✓ test/StateMachine/constructor.test.js > StateMachine > context > starts with an empty context
✓ test/StateMachine/constructor.test.js > StateMachine > context > keeps whatever is written into its context
✓ test/StateMachine/constructor.test.js > StateMachine > context > hands out the same context object every time
✓ test/StateMachine/constructor.test.js > StateMachine > context > does not let the context be swapped for another object
✓ test/StateMachine/constructor.test.js > StateMachine > context > gives each machine a context of its own
✓ test/StateMachine/defineState.test.js > StateMachine > defineState > hands back the machine so definitions can be chained
✓ test/StateMachine/defineState.test.js > StateMachine > defineState > passes a bad state name straight on as a TypeError
✓ test/StateMachine/defineState.test.js > StateMachine > defineState > passes a bad hook straight on as a TypeError
✓ test/StateMachine/defineState.test.js > StateMachine > defineState > accepts a state without any hooks
✓ test/StateMachine/defineState.test.js > StateMachine > defineState > refuses to define the same state name twice
✓ test/StateMachine/defineState.test.js > StateMachine > defineState > refuses a duplicate state name even when the hooks differ
✓ test/StateMachine/defineState.test.js > StateMachine > defineState > does not list a state name twice when it refuses a duplicate
✓ test/StateMachine/defineState.test.js > StateMachine > defineState > keeps the current state untouched when states are defined
✓ test/StateMachine/defineState.test.js > StateMachine > stateNames > knows about no states before any are defined
✓ test/StateMachine/defineState.test.js > StateMachine > stateNames > lists the states it has been told about, in definition order
✓ test/StateMachine/defineState.test.js > StateMachine > stateNames > cannot be changed through the list of names it returns
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > hands back the machine so transitions can be chained
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > accepts a transition with a guard
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > accepts a transition that starts and ends in the same state
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > throws a TypeError when from is not a non-empty string
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > throws a TypeError when to is not a non-empty string
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > throws a TypeError when on is not a non-empty string
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > throws a TypeError when the guard is not a function
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > throws a TypeError when no move is given at all
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > refuses a transition from a state that was never defined
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > refuses a transition to a state that was never defined
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > names the state that was never defined in the error
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > checks the field types before it checks that the states exist
✓ test/StateMachine/defineTransition.test.js > StateMachine > defineTransition > does not register a transition it refuses
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > sees no way out of a state before any transition is defined
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > lists the events that lead out of a state, in definition order
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > lists an event once even when several transitions share it
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > keeps a shared event where it was first defined
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > lists only events that leave the state it was asked about
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > sees no way out of a state that no transition leaves
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > throws an UnknownStateError for a state that was never defined
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > throws a TypeError when the state name is not a non-empty string
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > lists a guarded event even though the guard refuses the move
✓ test/StateMachine/defineTransition.test.js > StateMachine > listEventNamesFrom > cannot be changed through the list of events it returns
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > sees no way out of a state before any transition is defined
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > lists the events that lead out of a state, in definition order
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > lists an event once even when several transitions share it
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > keeps a shared event where it was first defined
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > lists only events that leave the state it was asked about
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > sees no way out of a state that no transition leaves
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > throws an UnknownStateError for a state that was never defined
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > throws a TypeError when the state name is not a non-empty string
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > lists a guarded event even though the guard refuses the move
✓ test/StateMachine/defineTransition.test.js > StateMachine > eventNamesFrom > cannot be changed through the list of events it returns
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > finds the shortest chain of events from the state the machine is in
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > gives an empty chain when the machine is already in the state
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > throws a NoPathError naming both states when no chain of events leads there
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > does not ask the guards
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > neither moves the machine nor runs a hook
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > throws an UnknownStateError for a state that was never defined
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > throws an UnknownStateError instead of a NoPathError when the starting state was never defined
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > throws a TypeError when the state name is not a non-empty string
✓ test/StateMachine/findPathTo.test.js > StateMachine > findPathTo > cannot be changed through the path it returns
✓ test/StateMachine/history.test.js > StateMachine > history > is empty before any event is sent
✓ test/StateMachine/history.test.js > StateMachine > history > records each move, oldest first
✓ test/StateMachine/history.test.js > StateMachine > history > records the transition whose guard allowed the move
✓ test/StateMachine/history.test.js > StateMachine > history > records no move when send throws a NoTransitionError
✓ test/StateMachine/history.test.js > StateMachine > history > records no move when send throws a BlockedTransitionError
✓ test/StateMachine/history.test.js > StateMachine > history > records no move when the exit hook throws an error
✓ test/StateMachine/history.test.js > StateMachine > history > records the move when the enter hook throws an error
✓ test/StateMachine/history.test.js > StateMachine > history > records no move when canSend answers true
✓ test/StateMachine/history.test.js > StateMachine > history > returns a copy, so removing a move from it leaves the history unchanged
✓ test/StateMachine/send.test.js > StateMachine > send > moves along the transition the event triggers
✓ test/StateMachine/send.test.js > StateMachine > send > returns nothing, so that moving and asking stay separate
✓ test/StateMachine/send.test.js > StateMachine > send > follows several events in a row
✓ test/StateMachine/send.test.js > StateMachine > send > picks the transition that leaves its current state
✓ test/StateMachine/send.test.js > StateMachine > send > can take a transition that starts and ends in the same state
✓ test/StateMachine/send.test.js > StateMachine > send > refuses an event that has no transition from the current state
✓ test/StateMachine/send.test.js > StateMachine > send > names both the state and the event in the error it throws
✓ test/StateMachine/send.test.js > StateMachine > send > stays in the state it was in when it refuses the event
✓ test/StateMachine/send.test.js > StateMachine > send > refuses an event whose transition leaves a state it is not in
✓ test/StateMachine/send.test.js > StateMachine > send > throws a TypeError when the event name is not a non-empty string
✓ test/StateMachine/send.test.js > StateMachine > send > throws an UnknownStateError instead of a NoTransitionError when the starting state was never defined
✓ test/StateMachine/send.test.js > StateMachine > send > moves when the guard allows the transition
✓ test/StateMachine/send.test.js > StateMachine > send > refuses the event when the guard blocks the transition
✓ test/StateMachine/send.test.js > StateMachine > send > stays in the state it was in when the guard blocks the transition
✓ test/StateMachine/send.test.js > StateMachine > send > runs no hook when the guard blocks the transition
✓ test/StateMachine/send.test.js > StateMachine > send > passes its own context object to the guard
✓ test/StateMachine/send.test.js > StateMachine > send > moves on a later send once the guard allows it
✓ test/StateMachine/send.test.js > StateMachine > send > asks the guard before it runs the exit hook
✓ test/StateMachine/send.test.js > StateMachine > send > stays in the state it was in when the guard throws an error
✓ test/StateMachine/send.test.js > StateMachine > send > takes the first transition on the event whose guard allows it
✓ test/StateMachine/send.test.js > StateMachine > send > takes the earlier of two transitions whose guards both allow it
✓ test/StateMachine/send.test.js > StateMachine > send > does not ask a later guard once an earlier one allows the move
✓ test/StateMachine/send.test.js > StateMachine > send > reports the first transition when every guard on the event blocks its transition
✓ test/StateMachine/send.test.js > StateMachine > send > asks each guard once when every guard on the event blocks its transition
✓ test/StateMachine/send.test.js > StateMachine > send > runs the exit hook, then the enter hook, and no other hook
✓ test/StateMachine/send.test.js > StateMachine > send > passes its own context object to the exit and enter hooks
✓ test/StateMachine/send.test.js > StateMachine > send > moves after the exit hook runs and before the enter hook runs
✓ test/StateMachine/send.test.js > StateMachine > send > runs the exit and enter hooks when leaving and re-entering the same state
✓ test/StateMachine/send.test.js > StateMachine > send > runs no hook when it refuses the event
✓ test/StateMachine/send.test.js > StateMachine > send > stays in the state it was in when the exit hook throws an error
✓ test/StateMachine/send.test.js > StateMachine > send > has already moved when the enter hook throws an error
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > moves back to the state it left on its last move
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > removes the undone move from the history
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > undoes one move per call, back to the starting state
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > does nothing when there is no move to undo
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > returns nothing, whether or not there was a move to undo
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > moves back without asking the guard
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > runs the exit hook of the state it leaves, then the enter hook of the state it moves back to
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > does not undo what the hooks wrote into the context
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > keeps the current state and the move in the history when the exit hook throws an error
✓ test/StateMachine/undoLastMove.test.js > StateMachine > undoLastMove > has already moved back and removed the move when the enter hook throws an error
✓ test/StateRegistry.test.js > StateRegistry > finds a state that has been registered
✓ test/StateRegistry.test.js > StateRegistry > does not find a name that was never registered
✓ test/StateRegistry.test.js > StateRegistry > finds nothing before anything is registered
✓ test/StateRegistry.test.js > StateRegistry > keeps registries independent of each other
✓ test/StateRegistry.test.js > StateRegistry > hands back the very state that was registered
✓ test/StateRegistry.test.js > StateRegistry > hands back nothing for a name that was never registered
✓ test/StateRegistry.test.js > StateRegistry > lists the names of every registered state in registration order
✓ test/StateRegistry.test.js > StateRegistry > lists no names while empty
✓ test/StateRegistry.test.js > StateRegistry > cannot be changed through the list of names it hands out
✓ test/StateRegistry.test.js > StateRegistry > rejects values that are not states
✓ test/StateRegistry.test.js > StateRegistry > rejects a name that is already registered
✓ test/StateRegistry.test.js > StateRegistry > names the rejected state in the error
✓ test/StateRegistry.test.js > StateRegistry > keeps the first state when it rejects a duplicate name
✓ test/StateRegistry.test.js > StateRegistry > still accepts a different name after rejecting a duplicate
✓ test/Transition.test.js > Transition > exposes the move it was given
✓ test/Transition.test.js > Transition > allows a move that returns to the same state
✓ test/Transition.test.js > Transition > rejects from unless it is a non-empty string
✓ test/Transition.test.js > Transition > rejects to unless it is a non-empty string
✓ test/Transition.test.js > Transition > rejects on unless it is a non-empty string
✓ test/Transition.test.js > Transition > is triggered by the event it was built with
✓ test/Transition.test.js > Transition > is not triggered by any other event
✓ test/Transition.test.js > Transition > tells events apart by case
✓ test/Transition.test.js > Transition > answers false instead of throwing an error when the event name is not a non-empty string
✓ test/Transition.test.js > Transition > accepts a move without a guard
✓ test/Transition.test.js > Transition > accepts a function as a guard
✓ test/Transition.test.js > Transition > rejects a guard that is not a function
✓ test/Transition.test.js > Transition > is allowed in any context when it has no guard
✓ test/Transition.test.js > Transition > is allowed when its guard returns true
✓ test/Transition.test.js > Transition > is not allowed when its guard returns false
✓ test/Transition.test.js > Transition > passes the context on to its guard
✓ test/Transition.test.js > Transition > allows the move when its guard returns a non-empty string
✓ test/Transition.test.js > Transition > allows the move when its guard returns a positive number
✓ test/Transition.test.js > Transition > allows the move when its guard returns an empty array
✓ test/Transition.test.js > Transition > allows the move when its guard returns an empty object
✓ test/Transition.test.js > Transition > blocks the move when its guard returns zero
✓ test/Transition.test.js > Transition > blocks the move when its guard returns an empty string
✓ test/Transition.test.js > Transition > blocks the move when its guard returns null
✓ test/Transition.test.js > Transition > blocks the move when its guard returns undefined
✓ test/Transition.test.js > Transition > blocks the move when its guard returns NaN
✓ test/Transition.test.js > Transition > asks its guard again on every call
✓ test/Transition.test.js > Transition > rejects being built without a move at all
✓ test/Transition.test.js > Transition > says in the error message that the event name is missing
✓ test/TransitionHistory.test.js > TransitionHistory > lists no entries while empty
✓ test/TransitionHistory.test.js > TransitionHistory > lists the very entries that were recorded, oldest first
✓ test/TransitionHistory.test.js > TransitionHistory > keeps histories independent of each other
✓ test/TransitionHistory.test.js > TransitionHistory > cannot be changed through the list of entries it returns
✓ test/TransitionHistory.test.js > TransitionHistory > rejects values that are not history entries
✓ test/TransitionHistory.test.js > TransitionHistory > leaves the entries unchanged when record throws a TypeError
✓ test/TransitionHistory.test.js > TransitionHistory > removes the newest entry
✓ test/TransitionHistory.test.js > TransitionHistory > returns the entry it removes
✓ test/TransitionHistory.test.js > TransitionHistory > returns undefined when there is no entry to remove
✓ test/TransitionHistory.test.js > TransitionHistory > gives the newest entry without removing it
✓ test/TransitionHistory.test.js > TransitionHistory > gives undefined as the newest entry while empty
✓ test/TransitionRegistry.test.js > TransitionRegistry > finds a transition by the state it leaves and the event it answers to
✓ test/TransitionRegistry.test.js > TransitionRegistry > finds nothing while empty
✓ test/TransitionRegistry.test.js > TransitionRegistry > finds nothing when the event does not match
✓ test/TransitionRegistry.test.js > TransitionRegistry > finds nothing when the state does not match
✓ test/TransitionRegistry.test.js > TransitionRegistry > tells two transitions apart that share an event name
✓ test/TransitionRegistry.test.js > TransitionRegistry > finds every match in registration order, alike ones included
✓ test/TransitionRegistry.test.js > TransitionRegistry > ignores guards when searching
✓ test/TransitionRegistry.test.js > TransitionRegistry > keeps registries independent of each other
✓ test/TransitionRegistry.test.js > TransitionRegistry > cannot be changed through the matches it returns
✓ test/TransitionRegistry.test.js > TransitionRegistry > lists every way out of a state, in registration order
✓ test/TransitionRegistry.test.js > TransitionRegistry > lists no way out of a state that has none
✓ test/TransitionRegistry.test.js > TransitionRegistry > lists no way out while empty
✓ test/TransitionRegistry.test.js > TransitionRegistry > leaves out transitions that start somewhere else
✓ test/TransitionRegistry.test.js > TransitionRegistry > lists a transition even when its guard says no
✓ test/TransitionRegistry.test.js > TransitionRegistry > lists a transition that returns to the same state
✓ test/TransitionRegistry.test.js > TransitionRegistry > cannot be changed through the list it returns
✓ test/TransitionRegistry.test.js > TransitionRegistry > rejects values that are not transitions
✓ test/errors.test.js > FlowStateError > is a normal Error, so it can be thrown and caught like one
✓ test/errors.test.js > FlowStateError > is not a TypeError, so a caller can tell it apart from a wrong argument type
✓ test/errors.test.js > FlowStateError > is named after its own class
✓ test/errors.test.js > FlowStateError > carries a stack trace
✓ test/errors.test.js > UnknownStateError > can be caught as a FlowStateError
✓ test/errors.test.js > UnknownStateError > can be caught as a plain Error
✓ test/errors.test.js > UnknownStateError > is named after its own class, not after the base class
✓ test/errors.test.js > UnknownStateError > names the state in its message
✓ test/errors.test.js > UnknownStateError > hands out the state name without parsing the message
✓ test/errors.test.js > UnknownStateError > does not let the state name be written from outside
✓ test/errors.test.js > DuplicateStateError > can be caught as a FlowStateError
✓ test/errors.test.js > DuplicateStateError > can be caught as a plain Error
✓ test/errors.test.js > DuplicateStateError > is named after its own class, not after the base class
✓ test/errors.test.js > DuplicateStateError > names the state in its message
✓ test/errors.test.js > DuplicateStateError > hands out the state name without parsing the message
✓ test/errors.test.js > DuplicateStateError > does not let the state name be written from outside
✓ test/errors.test.js > NoTransitionError > can be caught as a FlowStateError
✓ test/errors.test.js > NoTransitionError > is named after its own class, not after the base class
✓ test/errors.test.js > NoTransitionError > hands out the state name and the event name without parsing the message
✓ test/errors.test.js > NoTransitionError > does not let the state name or the event name be written from outside
✓ test/errors.test.js > NoTransitionError > is not one of the errors about a single state name
✓ test/errors.test.js > NoTransitionError > has no stateName, since it carries more than one name
✓ test/errors.test.js > BlockedTransitionError > can be caught as a FlowStateError
✓ test/errors.test.js > BlockedTransitionError > is named after its own class, not after the base class
✓ test/errors.test.js > BlockedTransitionError > hands out the state name and the event name without parsing the message
✓ test/errors.test.js > BlockedTransitionError > does not let the state name or the event name be written from outside
✓ test/errors.test.js > BlockedTransitionError > is not one of the errors about a single state name
✓ test/errors.test.js > BlockedTransitionError > has no stateName, since it carries more than one name
✓ test/errors.test.js > NoTransitionError > names both the state and the event in its message
✓ test/errors.test.js > NoTransitionError > has no toStateName, since there is no transition to take one from
✓ test/errors.test.js > BlockedTransitionError > puts all three names of the transition in its message
✓ test/errors.test.js > BlockedTransitionError > hands out the name of the state the transition would have entered
✓ test/errors.test.js > BlockedTransitionError > does not let toStateName be written from outside
✓ test/errors.test.js > BlockedTransitionError > does not swap the two state names
✓ test/errors.test.js > NoPathError > can be caught as a FlowStateError
✓ test/errors.test.js > NoPathError > is named after its own class
✓ test/errors.test.js > NoPathError > names both states in its message
✓ test/errors.test.js > NoPathError > hands out both state names without parsing the message, in the right order
✓ test/errors.test.js > NoPathError > does not let the state names be written from outside
✓ test/errors.test.js > NoPathError > is not one of the errors about a refused event
✓ test/errors.test.js > the error family > exports the error types a caller can catch, and nothing else
✓ test/errors.test.js > the error family > lets one catch handle every error the module throws
✓ test/errors.test.js > the error family > tells an unknown state apart from a duplicate one
✓ test/errors.test.js > the error family > tells a missing transition apart from a blocked one
✓ test/errors.test.js > the error family > says different things about the same state name
✓ test/index.test.js > flowstate-js > exports the state machine and the error types a caller can catch, and nothing else
✓ test/index.test.js > flowstate-js > lets a caller catch an error from the machine by the type it imported
✓ test/names.test.js > StateName > gives back the text it was created from
✓ test/names.test.js > StateName > keeps spaces inside the name
✓ test/names.test.js > StateName > rejects a value that is not a non-empty string
✓ test/names.test.js > StateName > rejects a name that starts or ends with whitespace
✓ test/names.test.js > StateName > names its own class in the error message
✓ test/names.test.js > StateName > does not let the text be written from outside
✓ test/names.test.js > EventName > gives back the text it was created from
✓ test/names.test.js > EventName > keeps spaces inside the name
✓ test/names.test.js > EventName > rejects a value that is not a non-empty string
✓ test/names.test.js > EventName > rejects a name that starts or ends with whitespace
✓ test/names.test.js > EventName > names its own class in the error message
✓ test/names.test.js > EventName > does not let the text be written from outside
✓ test/names.test.js > StateName and EventName > are separate types, so a state name is not an event name

 Test Files  19 passed (19)
      Tests  291 passed (291)
```

</details>

## Conclusion

All 291 unit tests and every step of the tour passed on 2026-10-17, and the unit tests cover 100% of `src/`.
The gaps, such as other operating systems, browsers and typing into a real terminal, are listed under
[Not tested](#not-tested).
