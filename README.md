# ChatSocket

**A ChatTriggers module**
Configure and open a WebSocket connection to send and receive ChatTrigger events in real time. This can serve as a bridge between Minecraft and the World Wide Web!

## Installation

1. Install [ChatTriggers](https://github.com/ChatTriggers/ChatTriggers/releases)
2. Download `ChatSocket.zip` from [Releases](https://github.com/Khoeckman/ChatSocket/releases/latest)
3. Extract `ChatSocket.zip` to `%appdata%/.minecraft/config/ChatTriggers/modules/`
4. Launch Minecraft or reload all ChatTriggers modules by running `/ct load` in chat.
5. After loading it should say: `[ChatSocket] Module Loaded. Type "/cs" for help.`

## How To Use

The **ChatSocket** module allows you to interact with Minecraft programmatically **without modifying Minecraft’s internal code**. It achieves this using **WebSocket communication**, letting you send and receive messages between your own WebSocket server and Minecraft.

### Setting Up Your Server

1. You can start from the template in `WebSocketServer/`, or build your server in any language you prefer.
2. The only requirement is that messages follow the **ChatSocket encoding format**.

### Message Encoding

Each message sent between the server and client must follow this syntax:

```
SECRET_KEY TYPE VALUE
```

- `SECRET_KEY` — Your authentication key. **Must not contain spaces.**
- `TYPE` — The message type (e.g., `AUTH`, `CHAT`, or custom types).
- `VALUE` — The payload of the message. Can contain spaces and does not need to be trimmed.

**Example:**

```
3b9e06e2db0ba8327d6584e5c2cd1f2e CHAT Hello Minecraft!
```

### Notes

- The module handles message encoding and decoding automatically; you only need to follow the syntax.
- You can extend the module by overriding hooks like `ChatSocket_onReceive` to implement custom behavior for different message types.
- Keep your `SECRET_KEY` secure if your WebSocket server is public.

## Hooks

### `ChatSocket_onMessage(type, value, settings)`

This hook allows your module to handle incoming messages from the ChatSocket server. You can override it to implement custom logic for different message types.

**Usage:**

1. Add `'ChatSocket'` to the `requires` array in your module.
2. Override this function in your module.

**Parameters:**

| Name       | Type       | Description                                                                              |
| ---------- | ---------- | ---------------------------------------------------------------------------------------- |
| `type`     | `string`   | The type of the message sent by the server (e.g., `'AUTH'`, `'CHAT'`, `'SAY'`, `'CMD'`). |
| `value`    | `any`      | The payload of the message.                                                              |
| `settings` | `Settings` | The user-configurable ChatSocket options. (see `src/vigilance/settings.js`)              |

> **Note:** The default implementation of this hook can be found in [`src/utils/global.js`](src/utils/global.js).

**Example Override:**

```js
global.ChatSocket_onMessage = function (type, value, settings) {
  if (type === 'CUSTOM') {
    // Custom logic
  }
  ChatLib.chat(`&cError: Unsupported type '${type}'`)
}
```

## Credits

This module contains modified code from the following modules:

1. [Vigilance - By FalseHonesty](https://chattriggers.com/modules/v/Vigilance)
2. [WebSocket - By Debug](https://chattriggers.com/modules/v/WebSocket)

## Devdependencies

[CTAutocomplete - By lotymax](https://chattriggers.com/modules/v/CTAutocomplete)

Run `/ct import CTAutocomplete` in Minecraft to be able to use this devdependency.
This is only necessary if you wish to make changes to ChatSocket.
