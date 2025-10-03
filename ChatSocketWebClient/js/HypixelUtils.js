// Helper functions for Hypixel Housing (copy this folder to another location later)

class HypixelUtils {
  static selectRegion(ws, from, to) {
    if (!(ws instanceof ChatSocketWebClient)) throw new TypeError('ws is not an instance of ChatSocketWebClient')
    if (!from || !Number.isInteger(from.x) || !Number.isInteger(from.y) || !Number.isInteger(from.z))
      throw new TypeError(`from is not of type {x: int, y: int, z: int}`)
    if (!to || !Number.isInteger(to.x) || !Number.isInteger(to.y) || !Number.isInteger(to.z))
      throw new TypeError(`to is not of type {x: int, y: int, z: int}`)

    ws.sendEncoded('CMD', `tp ${from.x} ${from.y} ${from.z}`)
    ws.sendEncoded('CMD', 'posa')
    ws.sendEncoded('CMD', `tp ${to.x} ${to.y} ${to.z}`)
    ws.sendEncoded('CMD', 'posb')
  }

  static proTools(ws, action, arg = null) {
    if (!(ws instanceof ChatSocketWebClient)) throw new TypeError('ws is not an instance of ChatSocketWebClient')

    const actions = ['set', 'fill', 'walls', 'wireframe', 'cut', 'copy', 'paste', 'undo']
    if (!actions.includes(action)) throw new TypeError(`action is not one of: ${actions.split(', ')}`)

    if (arg && typeof arg !== 'string') throw new TypeError(`arg is defined but not a string`)

    ws.sendEncoded('CMD', `${action} ${arg ?? ''}`)
  }
}
