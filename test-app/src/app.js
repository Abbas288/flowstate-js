import { stdin, stdout } from 'node:process'
import { OrderController } from './OrderController.js'
import { OrderView } from './OrderView.js'

const orderView = new OrderView(stdin, stdout)
const orderController = new OrderController(orderView)

await orderController.start()
