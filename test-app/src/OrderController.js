import { FlowStateError } from 'flowstate-js'
import { OrderModel } from './OrderModel.js'
import { TypedValue } from './TypedValue.js'

/**
 * @typedef {object} TestAppCommand
 * @property {string} name - What the user types, the first word of the usage.
 * @property {string} usage - Such as "send <event>".
 * @property {string} description - Shown in the panel.
 * @property {boolean} requiresArgument - True if the usage has an argument in angle brackets.
 * @property {(argument?: string) => void} run - Gets the typed argument.
 */

/**
 * Each command is named after a StateMachine method or property, and shows the call and what came back.
 */
export class OrderController {
  #view
  #model
  #isStopped = false

  /** @type {TestAppCommand[]} */
  #commands = []

  /**
   * Nothing is read until start is called.
   *
   * @param {import('./OrderView.js').OrderView} orderView - All input and output goes through it.
   */
  constructor(orderView) {
    this.#view = orderView
    this.#model = this.#createModel()
    this.#commands = this.#createCommands()
  }

  /** Runs one command per line, until quit or the end of the input. */
  async start() {
    this.#view.showPanel(this.#model.describeMoves(), this.#commands)
    this.#askForCommand()
    await this.#runTypedLines()
    this.#view.close()
  }

  /** Stops at quit or at the end of the input. */
  async #runTypedLines() {
    for await (const line of this.#view.readLines()) {
      this.#view.showTypedLine(line)
      this.#runLine(line.trim())

      if (this.#isStopped) {
        break
      }

      this.#askForCommand()
    }
  }

  /**
   * The view shows each hook that runs.
   *
   * @returns {OrderModel} A new order.
   */
  #createModel() {
    return new OrderModel((hookName, stateName) => this.#view.writeHook(hookName, stateName))
  }

  /**
   * The panel lists them in this order.
   *
   * @returns {TestAppCommand[]} Every command.
   */
  #createCommands() {
    return [
      this.#createMethodCommand('send <event>', 'send an event'),
      this.#createMethodCommand('undoLastMove', 'move back along the last move'),
      this.#createMethodCommand('canSend <event>', 'would send move the order now?'),
      this.#createMethodCommand('listEventNamesFrom [state]', 'the events out of a state (default: current)'),
      this.#createMethodCommand('eventNamesFrom [state]', 'deprecated v1 name of listEventNamesFrom'),
      this.#createMethodCommand('canReach <state>', 'does a chain of events lead there? (guards ignored)'),
      this.#createMethodCommand('findPathTo <state>', 'the shortest chain of events there (guards ignored)'),
      this.#createPropertyCommand('currentStateName', 'the state the order is in'),
      this.#createPropertyCommand('stateNames', 'every state'),
      this.#createCommand('history', 'every move so far, oldest first', () =>
        this.#view.writeHistory(this.#model.machine.history)
      ),
      this.#createPropertyCommand('context', 'the data guards and hooks receive'),
      this.#createCommand('context.<name> = <value>', "set a value: a number, true, false or 'text'", () =>
        this.#view.writeNote('Type a value, such as: context.amount = 250')
      ),
      this.#createCommand('reset', 'start over with a new order', () => this.#resetOrder()),
      this.#createCommand('quit', 'stop (or press Ctrl-C)', () => this.#stop()),
    ]
  }

  /**
   * The base of every command. Its name and its argument rule come from the usage.
   *
   * @param {string} usage - Such as "reset".
   * @param {string} description - For the panel.
   * @param {(argument?: string) => void} run - Gets the typed argument.
   * @returns {TestAppCommand} The command.
   */
  #createCommand(usage, description, run) {
    const [name] = usage.split(' ')
    const requiresArgument = usage.includes('<')

    return { name, usage, description, requiresArgument, run }
  }

  /**
   * The first word is the method. It gets the argument the usage names, and [state] defaults to the current one.
   *
   * @param {string} usage - Such as "send <event>".
   * @param {string} description - For the panel.
   * @returns {TestAppCommand} The command.
   */
  #createMethodCommand(usage, description) {
    const [methodName, argumentName] = usage.split(' ')

    return this.#createCommand(usage, description, (argument) => {
      const argumentOrCurrentState = argument ?? this.#model.currentStateName
      const callArguments = argumentName === undefined ? [] : [argumentOrCurrentState]

      this.#callMethod(methodName, callArguments)
    })
  }

  /**
   * Reads the StateMachine property of the same name.
   *
   * @param {string} propertyName - Also the command.
   * @param {string} description - For the panel.
   * @returns {TestAppCommand} The command.
   */
  #createPropertyCommand(propertyName, description) {
    return this.#createCommand(propertyName, description, () => {
      this.#view.writePropertyRead(propertyName)
      this.#view.writeResult(this.#model.machine[propertyName])
    })
  }

  /** Shows the state and the events out of it. */
  #askForCommand() {
    this.#view.writePrompt(this.#model.currentStateName, this.#model.listEventsLeadingOut())
  }

  /**
   * An empty line does nothing.
   *
   * @param {string} text - The typed line, trimmed.
   */
  #runLine(text) {
    const isContextAssignment = text.startsWith('context.') && text.includes('=')

    if (isContextAssignment) {
      this.#setContextValue(text)
    } else if (text !== '') {
      this.#runTypedCommand(text)
    }
  }

  /**
   * The first word is the command and the rest its argument.
   *
   * @param {string} text - The typed line, trimmed and not empty.
   */
  #runTypedCommand(text) {
    const [name, ...words] = text.split(/\s+/)
    const argument = words.length === 0 ? undefined : words.join(' ')
    const command = this.#commands.find((candidate) => candidate.name === name)

    if (command === undefined) {
      this.#view.writeNote(`Unknown command "${name}". The commands are in the list at the top.`)
    } else if (command.requiresArgument && argument === undefined) {
      this.#view.writeNote(`Type: ${command.usage}`)
    } else {
      this.#runCommand(command, argument)
    }
  }

  /**
   * A FlowStateError is shown. Any other error is a bug in the Test-App and is thrown again.
   *
   * @param {TestAppCommand} command - From the table.
   * @param {string} [argument] - As typed, if any.
   */
  #runCommand(command, argument) {
    try {
      command.run(argument)
    } catch (error) {
      if (!(error instanceof FlowStateError)) {
        throw error
      }

      this.#view.writeError(error)
    }
  }

  /**
   * Shows the call before it runs and the result after.
   *
   * @param {string} methodName - Such as "send".
   * @param {string[]} callArguments - Empty for a method without parameters.
   */
  #callMethod(methodName, callArguments) {
    const order = this.#model.machine

    this.#view.writeMethodCall(methodName, callArguments)

    const result = order[methodName](...callArguments)

    this.#view.writeResult(result)

    if (methodName === 'eventNamesFrom') {
      this.#view.writeDeprecation('Note: eventNamesFrom is the old v1 name of listEventNamesFrom.')
    }
  }

  /**
   * Takes a line such as context.note = 'gift'. Only the first = splits the line.
   *
   * @param {string} text - The typed line.
   */
  #setContextValue(text) {
    const equalsIndex = text.indexOf('=')
    const name = text.slice('context.'.length, equalsIndex).trim()
    const valueText = text.slice(equalsIndex + 1).trim()
    const typedValue = new TypedValue(valueText)

    if (typedValue.isValid) {
      this.#model.machine.context[name] = typedValue.toValue()
      this.#view.writeContextAssignment(name, this.#model.machine.context[name])
    } else {
      this.#view.writeNote("Type a number, true, false or text in quotes, such as: context.note = 'gift'")
    }
  }

  /** The old order and its context are dropped. The note reads the start values from the new order. */
  #resetOrder() {
    this.#model = this.#createModel()
    const amount = this.#model.machine.context.amount

    this.#view.writeNote(`A new order, in ${this.#model.currentStateName}, with an amount of ${amount}.`)
  }

  /** The loop in start ends after the current line. */
  #stop() {
    this.#isStopped = true
  }
}
