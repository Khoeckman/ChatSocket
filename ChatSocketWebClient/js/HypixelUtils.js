// Helper functions for Hypixel Housing (copy this folder to another location later)

class HypixelUtils {
  static selectRegion(ws, pos1, pos2) {
    if (!(ws instanceof ChatSocketWebClient)) throw new TypeError('ws is not an instance of ChatSocketWebClient')
    if (!pos1 || !Number.isInteger(pos1.x) || !Number.isInteger(pos1.y) || !Number.isInteger(pos1.z))
      throw new TypeError(`pos1 is not of type {x: int, y: int, z: int}`)
    if (!pos2 || !Number.isInteger(pos2.x) || !Number.isInteger(pos2.y) || !Number.isInteger(pos2.z))
      throw new TypeError(`pos2 is not of type {x: int, y: int, z: int}`)

    ws.sendEncoded('SERVER_CMD', `tp ${pos1.x + 0.5} ${pos1.y + 0.5} ${pos1.z + 0.5}`)
    ws.sendEncoded('SERVER_CMD', 'posa')
    ws.sendEncoded('SERVER_CMD', `tp ${pos2.x + 0.5} ${pos2.y + 0.5} ${pos2.z + 0.5}`)
    ws.sendEncoded('SERVER_CMD', 'posb')
  }

  static proTools(ws, action, arg = null) {
    if (!(ws instanceof ChatSocketWebClient)) throw new TypeError('ws is not an instance of ChatSocketWebClient')

    const actions = ['set', 'fill', 'walls', 'wireframe', 'cut', 'copy', 'paste', 'undo']
    if (!actions.includes(action)) throw new TypeError(`action is not one of: ${actions.split(', ')}`)

    if (arg && typeof arg !== 'string') throw new TypeError(`arg is defined but not a string`)

    ws.sendEncoded('SERVER_CMD', `${action} ${arg ?? ''}`)
  }
}
