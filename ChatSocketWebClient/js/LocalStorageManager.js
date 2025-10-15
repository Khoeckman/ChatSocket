class LocalStorageManager {
  constructor(itemName, { defaultValue, encryptFn, decryptFn } = {}) {
    if (typeof itemName !== 'string') throw new TypeError('itemName is not a string')
    this.itemName = itemName

    this.defaultValue = defaultValue

    if (encryptFn && typeof encryptFn !== 'function') throw new TypeError('encryptFn is defined but is not a function')
    this.encryptFn = encryptFn || ((value) => value)

    if (decryptFn && typeof decryptFn !== 'function') throw new TypeError('decryptFn is defined but is not a function')
    this.decryptFn = decryptFn || ((value) => value)

    if (this.value === undefined) this.value = this.defaultValue
  }

  set value(value) {
    if (value.constructor === Object) value = '\0' + JSON.stringify(value)
    localStorage.setItem(this.itemName, this.encryptFn(value))
  }

  get value() {
    let value = this.decryptFn(localStorage.getItem(this.itemName))
    if (value.startsWith('\0')) value = JSON.parse(value.slice(1))
    return value ?? this.defaultValue
  }
}
