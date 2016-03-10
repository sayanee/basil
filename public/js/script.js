function format1DecPlace(floatValue) {
  return Math.round(floatValue * 10) / 10
}

function addStatus(currentData, meta) {
  var status = document.getElementById('status')
  status.innerHTML = setMessage(currentData, meta)

  setTimeout(function() {
    status.className = status.className + ' show ' + setIndicatorLevel(currentData, meta);
  }, 10);
}

function setMessage(currentData, meta) {
  var message = 'My temperature is <strong>' + format1DecPlace(currentData.value) + '°C</strong>, state of charge is ' + format1DecPlace(meta.soc) + ', battery voltage is ' + format1DecPlace(meta.battery_voltage) + 'V.'
  var dateMessage = '<span>' + moment(currentData.datetime).format('MMM D, h:mm a') + '</span>'

  if (!currentData.value) {
    return 'Oops! Looks like I am not connected to the Internet. You want to check?' + dateMessage
  }

  if (meta.battery_charge_required) {
    message += ' Please charge your battery!'
  }

  return message + dateMessage
}

function setIndicatorLevel(currentData, meta) {
  if (meta.battery_charge_required) return 'error'
  if (!currentData.value) return 'warn'
  return ''
}

var channel = 'basil'
var dataStore = []
var meta = {}

fetch('/api')
.catch(function(error) {
  console.log(error)
})
.then(function(response) {
  response.json().then(function(data) {
    dataStore = data[ channel ]
    meta = data.meta

    addStatus(dataStore[ dataStore.length - 1 ], meta)
  })
})
