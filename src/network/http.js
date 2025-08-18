/* export function requestOptions(method, data = null) {
  method = method.toUpperCase()

  const options = {
    method,
    headers: {
      Accept: 'application/json',
    },
  }

  if (data !== null && !['GET', 'HEAD'].includes(method)) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(data)
  }

  return options
}
 */
