/**
 * ChatSocketProtocol provides static methods to encode and decode
 * messages for the ChatSocket system.
 *
 * This class is responsible for formatting messages into JSON
 * and parsing incoming JSON messages, ensuring consistent structure
 * for type, message, and data.
 *
 * @example
 * // Encode a message
 * const json = ChatSocketProtocol.encodeMessage('AUTH', 'Authenticating', { secret: '*', name: 'Client1' });
 *
 * // Decode a received message
 * const {type, message, data} = ChatSocketProtocol.decodeMessage(json);
 */
export default class ChatSocketProtocolTRA {
  /**
   * Encodes a message for ChatSocket.
   *
   * @param {string} type - The type of the message. Will be converted to uppercase.
   * @param {any} message - The message content. Will be converted to a string.
   * @param {Record<string, any>} [data={}] - Optional additional data to include; must be an object.
   *
   * @returns {string} A JSON string representing the encoded message.
   */
  static encodeMessage(type, message, data = {}) {
    if (!data || data.constructor !== Object) data = {}
    return TRA.encrypt(JSON.stringify({ type: String(type).toUpperCase(), message: String(message ?? ''), data }), 64)
  }

  /**
   * Parses a raw message received from ChatSocket.
   *
   * Converts a raw WebSocket message into a structured object containing
   * `type`, `message`, and `data`. Validates input and throws errors if invalid.
   *
   * @param {string|Buffer|ArrayBuffer|SharedArrayBuffer|Uint8Array} rawData
   *   The raw message data received from the WebSocket.
   *
   * @throws {TypeError} If `rawData` is empty/undefined or if the parsed message
   *   does not contain a valid `type` string.
   * @throws {SyntaxError} If `rawData` is not valid JSON.
   *
   * @returns {{
   *   type: string,
   *   message: string,
   *   data: Record<string, any>
   * }}
   *   An object with the following properties:
   *   - `type` — The uppercased message type.
   *   - `message` — Message content, always a string (may be empty).
   *   - `data` — Parsed data object, or an empty object if missing or invalid.
   */
  static decodeMessage(rawData) {
    if (!rawData) throw new TypeError('rawData is empty or undefined')

    let type, message, data

    try {
      ;({ type, message, data } = JSON.parse(TRA.decrypt(String(rawData), 64)))
    } catch (err) {
      throw new SyntaxError('Invalid JSON: ' + rawData)
    }

    // Message must have a type
    if (!type || typeof type !== 'string' || !type.length) throw new TypeError('type is not a string')

    return {
      type: type.toUpperCase(),
      message: String(message ?? ''),
      data: data && data.constructor === Object ? data : {},
    }
  }
}
