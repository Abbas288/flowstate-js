import { clearScreenDown, createInterface, cursorTo } from 'node:readline'
import { inspect } from 'node:util'

/**
 * All input and output of the Test-App. In a terminal, the screen starts over with the panel each time a
 * line is typed. Output to a file or a pipe gets the panel once.
 */
export class OrderView {
  #input
  #output
  #isTerminal
  #lineReader
  #panelText = ''
  #promptText = ''

  /**
   * The screen is cleared only when the output is a terminal. isTTY is true for a terminal,
   * but undefined for a file or a pipe.
   *
   * @param {import('node:stream').Readable} input - Such as process.stdin.
   * @param {import('node:stream').Writable} output - Such as process.stdout.
   */
  constructor(input, output) {
    this.#input = input
    this.#output = output
    this.#isTerminal = output.isTTY === true
  }

  /**
   * The lines come until close is called or the input ends.
   *
   * @returns {import('node:readline').Interface} The typed lines, for a for await loop.
   */
  readLines() {
    this.#lineReader = createInterface({ input: this.#input })

    return this.#lineReader
  }

  /** Lets the process end even while the input is still open, and the shell start on a new line. */
  close() {
    this.#lineReader?.close()
    this.#output.write('\n')
  }

  /**
   * In a terminal, the panel stays at the top of the screen. Otherwise it is written once.
   *
   * @param {import('./OrderModel.js').MoveDescription[]} moveDescriptions - In definition order.
   * @param {{ usage: string, description: string }[]} commands - In the order to list them.
   */
  showPanel(moveDescriptions, commands) {
    const moveLines = moveDescriptions.map((move) => this.#describeMove(move))
    const commandLines = commands.map((command) => `  ${command.usage.padEnd(28)}${command.description}`)
    const panelLines = [
      'flowstate-js Test-App',
      '',
      'Transitions (from --event--> to)',
      ...moveLines,
      '',
      'Commands',
      ...commandLines,
    ]

    this.#panelText = panelLines.join('\n')
    this.#drawPanel()
  }

  /**
   * In a terminal, the screen starts over with the panel and the typed line. Piped lines are not shown.
   *
   * @param {string} line - As typed.
   */
  showTypedLine(line) {
    if (this.#isTerminal) {
      this.#drawPanel()
      this.#output.write(`\n${this.#promptText}${line}\n`)
    }
  }

  /**
   * Comes after an empty line.
   *
   * @param {string} stateName - The current state.
   * @param {string[]} eventNames - The events out of it. None means an end state.
   */
  writePrompt(stateName, eventNames) {
    const events = eventNames.length === 0 ? 'end state' : eventNames.join(', ')

    this.#promptText = `${stateName} [${events}]> `
    this.#output.write(`\n${this.#promptText}`)
  }

  /**
   * Such as order.send('pay'), written before the call runs.
   *
   * @param {string} methodName - Such as "send".
   * @param {string[]} callArguments - Empty for a method without parameters.
   */
  writeMethodCall(methodName, callArguments) {
    const argumentList = callArguments.map((value) => inspect(value)).join(', ')

    this.#writeLine(`  order.${methodName}(${argumentList})`)
  }

  /**
   * Such as order.history, written before the property is read.
   *
   * @param {string} propertyName - Such as "history".
   */
  writePropertyRead(propertyName) {
    this.#writeLine(`  order.${propertyName}`)
  }

  /**
   * Such as order.context.amount = 250, written after the value is set.
   *
   * @param {string} name - The name in the context.
   * @param {*} value - The value it got.
   */
  writeContextAssignment(name, value) {
    this.#writeLine(`  order.context.${name} = ${inspect(value)}`)
  }

  /**
   * Undefined is written as completed. Anything else is written as returned.
   *
   * @param {*} value - What the call returned.
   */
  writeResult(value) {
    const indentedResult = this.#describeResult(value).replaceAll('\n', '\n  ')

    this.#writeLine(`  ${indentedResult}`)
  }

  /**
   * Writes order.history first. A HistoryEntry keeps its fields private, and each one is shown as a copy.
   *
   * @param {{ fromStateName: string, toStateName: string, eventName: string }[]} entries - Oldest first.
   */
  writeHistory(entries) {
    const copies = entries.map(({ fromStateName, toStateName, eventName }) => {
      return { fromStateName, toStateName, eventName }
    })

    this.writePropertyRead('history')
    this.writeResult(copies)
  }

  /**
   * Also lists the state and event names the error holds.
   *
   * @param {Error} error - From flowstate-js.
   */
  writeError(error) {
    this.#writeLine(`  threw ${error.name}: ${error.message}`)
    this.#writeLine(`    ${this.#describeNames(error)}`)
  }

  /**
   * Such as "[hook] onEnter of paid", indented below the call.
   *
   * @param {string} hookName - onEnter or onExit.
   * @param {string} stateName - The state the hook belongs to.
   */
  writeHook(hookName, stateName) {
    this.#writeLine(`    [hook] ${hookName} of ${stateName}`)
  }

  /**
   * Marked [test-app], to keep it apart from what flowstate-js returns.
   *
   * @param {string} text - The message.
   */
  writeNote(text) {
    this.#writeLine(`  [test-app] ${text}`)
  }

  /**
   * Marked [deprecated].
   *
   * @param {string} text - The message.
   */
  writeDeprecation(text) {
    this.#writeLine(`  [deprecated] ${text}`)
  }

  /**
   * Such as "placed --pay--> paid", with the guard rule after it if there is one.
   *
   * @param {import('./OrderModel.js').MoveDescription} move - One transition.
   * @returns {string} A panel line.
   */
  #describeMove(move) {
    const arrow = `  ${move.from} --${move.on}--> ${move.to}`

    return move.guardRule === undefined ? arrow : `${arrow}   (guard: ${move.guardRule})`
  }

  /**
   * Undefined means that the call returned nothing.
   *
   * @param {*} value - What the call returned.
   * @returns {string} Such as "returned true".
   */
  #describeResult(value) {
    return value === undefined ? 'completed (no return value)' : `returned ${inspect(value)}`
  }

  /**
   * Only the names the error has, such as "stateName: 'lost'".
   *
   * @param {Error} error - From flowstate-js.
   * @returns {string} The names and their values.
   */
  #describeNames(error) {
    const names = ['stateName', 'fromStateName', 'eventName', 'toStateName'].filter((name) => name in error)

    return names.map((name) => `${name}: ${inspect(error[name])}`).join(', ')
  }

  /** In a terminal, the screen is cleared first. */
  #drawPanel() {
    if (this.#isTerminal) {
      this.#clearScreen()
    }

    this.#output.write(`${this.#panelText}\n`)
  }

  /** Moves to the top left corner and clears everything below it. */
  #clearScreen() {
    cursorTo(this.#output, 0, 0)
    clearScreenDown(this.#output)
  }

  /**
   * Ends the line with a line break.
   *
   * @param {string} text - The line.
   */
  #writeLine(text) {
    this.#output.write(`${text}\n`)
  }
}
