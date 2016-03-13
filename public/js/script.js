function addStatus(currentData, meta) {
  document.getElementById('status').innerHTML = setMessage(currentData, meta)
  document.getElementById('datetime').innerHTML = moment(currentData.published_at).format('MMM D, h:mm a')

  var soc = currentData.state_of_charge
  var batteryEl = document.getElementById('battery')
  batteryEl.className = 'battery'

  document.getElementById('battery-soc').innerHTML = `Battery ${soc}%`

  if (soc < 20) {
    batteryEl.className += ' low'
  } else if (soc > 75) {
    batteryEl.className += ' full'
  } else {
    batteryEl.className += ' med'
  }

}

function setMessage(currentData, meta) {
  var message = 'My temperature is <strong>' + currentData.temperature + '°C</strong>, battery voltage is <strong>' + currentData.battery_voltage + 'V</strong>'

  if (!currentData.temperature) {
    return 'Oops! Looks like I am not connected to the Internet. You want to check?'
  }

  if (meta.battery_alert) {
    message += ' Please charge your battery!'
  }

  return message
}

var channel = 'basil'
var dataStore = []
var meta = {}

fetch('/api')
.catch(function(error) {
  console.log(error)
})
.then(function(response) {
  response.json().then(function(reply) {
    dataStore = reply.data
    meta = reply.meta

    addStatus(dataStore[ dataStore.length - 1 ], meta)
  })
})
