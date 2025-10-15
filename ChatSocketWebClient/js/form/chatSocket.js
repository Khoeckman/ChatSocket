const chatSocketForm = document.getElementById('chatSocket')

chatSocketForm.fields = {
  type: chatSocketForm.querySelector('.type select'),
  message: chatSocketForm.querySelector('.message input'),
  data: chatSocketForm.querySelector('.data input'),
}

// Byte labels

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

// Form submission

chatSocketForm.addEventListener('submit', (e) => {
  const form = e.target
  if (!(form instanceof HTMLFormElement)) return
  e.preventDefault()

  // Return if button is disabled
  if (+form.dataset.readyState !== ChatSocketWebClient.OPEN) return

  if (!ws || ws.readyState !== ChatSocketWebClient.OPEN) {
    window.alert(new Error('WebSocket is not in OPEN state'))
    return
  }

  const { type, message, data = {} } = form.fields

  try {
    let dataValue = JSON.parse(data.value || '{}')
    if (!dataValue || dataValue.constructor !== Object) dataValue = {}

    data.classList.remove('error')
    data.value = JSON.stringify(dataValue)

    ws.sendEncoded(type.value, message.value, dataValue)
  } catch (err) {
    console.error(err)
    data.classList.add('error')
  }
})
