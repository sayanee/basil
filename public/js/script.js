function format1DecPlace(floatValue) {
  return Math.round(floatValue * 10) / 10
}

function addStatus(currentData, meta) {
  document.getElementById('status').innerHTML = setMessage(currentData, meta)
  document.getElementById('datetime').innerHTML = moment(currentData.datetime).format('MMM D, h:mm a')
  document.getElementById('battery').innerHTML = `Battery ${format1DecPlace(meta.soc)}%`
}

function setMessage(currentData, meta) {
  var message = 'My temperature is <strong>' + format1DecPlace(currentData.value) + '°C</strong>, battery voltage is <strong>' + format1DecPlace(meta.battery_voltage) + 'V</strong>'

  if (!currentData.value) {
    return 'Oops! Looks like I am not connected to the Internet. You want to check?' + dateMessage
  }

  if (meta.battery_charge_required) {
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
  response.json().then(function(data) {
    dataStore = data[ channel ]
    meta = data.meta

    addStatus(dataStore[ dataStore.length - 1 ], meta)
  })
})
