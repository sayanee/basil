var socketAddress = '';
if (location.hostname !== 'localhost') {
  // For OpenShift Deployment socket connection
  if (location.protocol === 'https:') {
    socketAddress = 'wss://' + location.hostname + ':8443';
  } else {
    socketAddress = 'ws://' + location.hostname + ':8000';
  }
}
var socket = io.connect()

var statusEl = document.getElementById('status')
var datetimeEl = document.getElementById('datetime')
var socEl = document.getElementById('soc')
var batteryEl = document.getElementById('battery')

function addSampleDataStatus(sample) {
  var sampleEl = document.getElementById('sample')
  
  if (!sample) {
    if (sampleEl) {
      sampleEl.remove()
      return
    }
  }

  var sampleText = 'sample data!'

  if (sampleEl) {
    sampleEl.innerHTML = sampleText
    return
  } else {
    var newSampleEl = document.createElement('span')
    newSampleEl.setAttribute('id', 'sample')
    newSampleEl.innerHTML = sampleText
    document.getElementsByClassName('status')[0].appendChild(newSampleEl)
  }
}

socket.on('data', function(data) {
  statusEl.innerHTML = data.status
  datetimeEl.innerHTML = data.datetime
  socEl.innerHTML = data.soc
  batteryEl.dataset.charge = data.battery_status

  addSampleDataStatus(data.sample)
})
