export const encode = (type, message) => {
  return JSON.stringify({ type: type.toUpperCase(), message })
}
