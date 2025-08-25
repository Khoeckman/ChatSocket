import { PREFIX, error } from './'

// Add ChatSocket to 'requires' in your own module then
// override this function to add your own logic

global.ChatSocket_onReceive = function receive(ws, type, value) {
  const uri = ws.uri
  ChatLib.chat(PREFIX + uri + ': [' + type + '] ' + value)
}
