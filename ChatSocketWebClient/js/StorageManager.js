// @source https://www.npmjs.com/package/@khoeckman/storagemanager
class StorageManager {
  static version = '4.0.3'
  itemName
  defaultValue
  encodeFn
  decodeFn
  storage
  #value
  constructor(itemName, options = {}) {
    const {
      defaultValue: defaultValue,
      encodeFn: encodeFn = (value) => TRA.encrypt(value, 64),
      decodeFn: decodeFn = (value) => TRA.decrypt(value, 64),
      storage: storage = window.localStorage,
    } = options
    if (typeof itemName !== 'string') throw new TypeError('itemName is not a string')
    this.itemName = itemName
    this.defaultValue = defaultValue
    if (encodeFn && typeof encodeFn !== 'function') throw new TypeError('encodeFn is defined but is not a function')
    this.encodeFn = encodeFn || ((v) => v)
    if (decodeFn && typeof decodeFn !== 'function') throw new TypeError('decodeFn is defined but is not a function')
    this.decodeFn = decodeFn || ((v) => v)
    if (!(storage instanceof Storage)) throw new TypeError('storage must be an instance of Storage')
    this.storage = storage
    this.sync()
  }
  set value(value) {
    this.#value = value
    const stringValue = typeof value === 'string' ? value : '\0JSON\0 ' + JSON.stringify(value)
    this.storage.setItem(this.itemName, this.encodeFn(stringValue))
  }
  get value() {
    return this.#value ?? this.defaultValue
  }
  sync(decodeFn = this.decodeFn) {
    let value = this.storage.getItem(this.itemName)
    if (typeof value !== 'string') return this.reset()
    value = decodeFn(value)
    if (!value.startsWith('\0JSON\0 ')) return (this.value = value)
    value = value.slice(7)
    if (value === 'undefined') return (this.value = undefined)
    return (this.value = JSON.parse(value))
  }
  reset() {
    return (this.value = this.defaultValue)
  }
  remove() {
    this.#value = undefined
    this.storage.removeItem(this.itemName)
  }
  clear() {
    this.storage.clear()
  }
  isDefault() {
    return this.#value === this.defaultValue
  }
}
