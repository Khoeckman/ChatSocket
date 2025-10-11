const chatSocketSettingsDialog = document.getElementById('chatSocketSettingsDialog')
const chatSocketSettingsForm = document.getElementById('chatSocketSettings')

chatSocketSettingsForm.fields = {
  url: chatSocketSettingsForm.querySelector('.url input'),
  secret: chatSocketSettingsForm.querySelector('.secret input'),
}

const form = new FormValidator(chatSocketSettingsForm)

form.addValidator({
  name: 'chatsocketsettings-url',
  method: (field) => /^wss?:\/\/(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+(?::\d{1,5})?(?:\/\S*)?$/.test(field.value),
  message: 'WebSocket Server URL does not match pattern: ws(s)://domain(:port)(/path)',
})

form.addValidator({
  name: 'chatsocketsettings-secret',
  method: (field) => /hello/g.test(field.value),
  message: 'Secret is a required field',
})

chatSocketSettingsForm.addEventListener('submit', (e) => {
  e.preventDefault()

  const fields = chatSocketSettingsForm.fields

  localStorage.setItem(
    'chatsocket.settings',
    TRA.encrypt(JSON.stringify({ url: fields.url.value, secret: fields.secret.value }), 64)
  )
  chatSocketSettingsDialog.close()
})

chatSocketSettingsDialog.addEventListener('mousedown', (e) => {
  if (e.target === chatSocketSettingsDialog) chatSocketSettingsDialog.close()
})
