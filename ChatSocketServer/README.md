# ChatSocketServer

A Node.js WebSocket middleman between controllers (e.g. websites) and clients (e.g. Minecraft ChatTriggers).

## Usage

1. Open a terminal
2. Make sure your terminal is in the right directory `.\WebSocketServer\`
3. Run the following commands to start the WebSocket server:

```batch
npm i
npm run wss
```

## Secret Key

Make sure the `port` and `secret key` in `.env` matches the one in ChatSocket's settings.

1. In Minecraft: `/cs settings` > WebSocket > Secret Key
2. Copy the key and paste it in the `.env` file in this directory after `SECRET_KEY=`.
