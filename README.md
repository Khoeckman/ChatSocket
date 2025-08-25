# ChatSocket

**A ChatTriggers module**
Configure and open a WebSocket connection to send and receive ChatTrigger events in real time. This can serve as a bridge between Minecraft and the World Wide Web!

## Installation

1. Install [ChatTriggers](https://github.com/ChatTriggers/ChatTriggers/releases)
2. Download `ChatSocket.zip` from [Releases](https://github.com/Khoeckman/ChatSocket/releases/latest)
3. Extract `ChatSocket.zip` to `%appdata%/.minecraft/config/ChatTriggers/modules/`
4. Launch Minecraft or reload all ChatTriggers modules by running `/ct load` in chat.
5. After loading it should say: `[ChatSocket] Module Loaded. Type "/cs" for help.`

## Hooks

### `ChatSocket_onReceive(type, value, settings)`

This hook allows your module to handle incoming messages from the ChatSocket server. You can override it to implement custom logic for different message types.

**Usage:**

1. Add `'ChatSocket'` to the `requires` array in your module.
2. Override this function in your module.

**Parameters:**

| Name       | Type       | Description                                                                                                               |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `type`     | `string`   | The type of the message sent by the server (e.g., `'AUTH'`, `'CHAT'`, `'CMD'`).                                           |
| `value`    | `any`      | The payload of the message.                                                                                               |
| `settings` | `Settings` | The current ChatSocket settings instance, allowing access to user-configurable options. (see `src/vigilance/settings.js`) |

**Example Override:**

```js
global.ChatSocket_onReceive = function (type, value, settings) {
  const ws = this // Instance of `/src/net/ChatSocketClient.js`

  switch (type) {
    case 'AUTH':
      ChatLib.chat('Authenticated with server!')
      break
    case 'CHAT':
      // Only show if `wsLogChat` is false to prevent double messages
      if (!settings.wsLogChat) ChatLib.chat('Received: ' + value)
      break
  }
}
```

## Credits

This module contains modified code from the following modules:

1. [Vigilance - By FalseHonesty](https://chattriggers.com/modules/v/Vigilance)
2. [WebSocket - By Debug](https://chattriggers.com/modules/v/WebSocket)

## Devdependencies

Run `/ct import CTAutocomplete` in Minecraft to be able to use this devdependency.
This is only necessary if you wish to make changes to ChatSocket.

[CTAutocomplete - By lotymax](https://chattriggers.com/modules/v/CTAutocomplete)

```

```
