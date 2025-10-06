/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />

import { error } from './'

const Timer = Java.type('java.util.Timer')
const TimerTask = Java.type('java.util.TimerTask')

export default class Queue {
  _cooldown = 0
  _timer = null
  _executeFn = null
  isExecuting = false
  lastExecution = 0

  constructor(cooldown, executeFn) {
    this._cooldown = cooldown
    this.executeFn = executeFn

    this.clear()
    this.pause()
  }

  set cooldown(cd) {
    if (typeof cd !== 'number' || cd < 0) throw new TypeError('cooldown is not a positive number')
    this._cooldown = cd
    this.resume()
  }

  get cooldown() {
    return this._cooldown
  }

  set executeFn(fn) {
    if (typeof fn !== 'function') throw new TypeError('executeFn must be a function')
    this._executeFn = fn
  }

  get executeFn() {
    return this._executeFn
  }

  queue(entry) {
    this.fifo.push(entry)
    if (!this._timer) this.resume()
  }

  clear() {
    this.fifo = []
  }

  pause() {
    if (this._timer) {
      this._timer.cancel()
      this._timer = null
    }
  }

  resume() {
    this.pause()

    const timer = new Timer()

    const run = () => {
      try {
        if (!this.fifo.length) {
          this.pause()
          return
        }
        const entry = this.fifo.shift()

        if (!entry) {
          this.pause()
          return
        }

        if (typeof entry !== 'string') return

        this.isExecuting = true
        this.lastExecution = Date.now()
        this._executeFn(entry)
      } catch (err) {
        error(err, settings.printStackTrace)
        this.pause()
      } finally {
        this.isExecuting = false
      }
    }

    timer.schedule(
      new TimerTask({ run }),
      Math.max(this._cooldown - (Date.now() - this.lastExecution), 0),
      this._cooldown
    )
    this._timer = timer
  }
}
