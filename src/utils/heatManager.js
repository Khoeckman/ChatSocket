/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

import { chat } from './'

class Queue {
  constructor(queue = []) {
    this.queue = queue
  }

  set queue(queue) {
    if (!Array.isArray(queue)) throw new TypeError('queue is not an Array')
    this._queue = queue
  }

  get queue() {
    return this._queue
  }

  get length() {
    return this._queue.length
  }

  enqueue(entry) {
    this._queue.push(entry)
  }

  dequeueOldest() {
    return this._queue.shift()
  }

  dequeueNewest() {
    return this._queue.pop()
  }

  clear() {
    this._queue = []
  }
}

export const cmdQueue = new Queue()
