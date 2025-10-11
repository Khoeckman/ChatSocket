const chatSocketForm = document.getElementById('chatSocket')

chatSocketForm.fields = {
  type: chatSocketForm.querySelector('.type select'),
  message: chatSocketForm.querySelector('.message input'),
  data: chatSocketForm.querySelector('.data input'),
}

const messageBytes = document.querySelector('.message .bytes')
const dataBytes = document.querySelector('.data .bytes')

chatSocketForm.fields.message.name = `chatsocket-message-${chatSocketForm.fields.type.value.toLowerCase()}`
chatSocketForm.fields.data.name = `chatsocket-data-${chatSocketForm.fields.type.value.toLowerCase()}`

const updateBytes = (el, value) => (el.innerText = `(${new TextEncoder().encode(value).byteLength} B)`)

updateBytes(messageBytes, chatSocketForm.fields.message.value)
updateBytes(dataBytes, chatSocketForm.fields.data.value)

chatSocketForm.fields.type.addEventListener('input', (e) => {
  chatSocketForm.fields.message.name = `chatsocket-message-${e.target.value.toLowerCase()}`
  chatSocketForm.fields.data.name = `chatsocket-data-${e.target.value.toLowerCase()}`
})

chatSocketForm.fields.message.addEventListener('input', (e) => {
  updateBytes(messageBytes, e.target.value)
})

chatSocketForm.fields.data.addEventListener('input', (e) => {
  e.target.classList.remove('error')
  updateBytes(dataBytes, e.target.value)
})

chatSocketForm.addEventListener('submit', (e) => {
  e.preventDefault()

  // Return if button is disabled
  if (+e.target.dataset.readyState !== ChatSocketWebClient.OPEN) return

  if (!ws || ws.readyState !== ChatSocketWebClient.OPEN) {
    window.alert(new Error('WebSocket is not in OPEN state'))
    return
  }

  const fields = e.target.fields
  const type = fields.type.value
  const message = fields.message.value
  let data = {}

  try {
    data = JSON.parse(fields.data.value || '{}')
    if (!data || data.constructor !== Object) data = {}

    fields.data.classList.remove('error')
    fields.data.value = JSON.stringify(data)

    ws.sendEncoded(type, message, data)
  } catch (err) {
    console.error(err)
    fields.data.classList.add('error')
  }
})
