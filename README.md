# flowstate-js

A small state machine library for JavaScript. No dependencies.

## What it does

A state machine keeps track of which state something is in, and which events are allowed
to change that state. An order can go from `placed` to `paid`, but not straight to `shipped`.

Most libraries stop there. `flowstate-js` can also answer questions about the machine
itself:

- Which events take me from one state to another? You get the shortest list back.
- Are there states that can never be reached?
- Are there states you can never leave?
- Can I undo the last transition? Yes.

## What it does not do

- No nested or parallel states
- No async transitions
- No saving to a file or database
- No user interface

## Status

Early development.

## License

MIT — see [LICENSE](LICENSE).
