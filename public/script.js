var socketAddress = ''

if (location.hostname !== 'localhost') {
  var hostname = 'basil-sayanee.rhcloud.com'

  if (location.protocol === 'https:') {
    socketAddress = 'wss://' + hostname + ':8443'
  } else {
    socketAddress = 'ws://' + hostname + ':8000'
  }
}

var socket = io.connect(socketAddress, {
  'forceNew': true,
  'transports': ['websocket']
})

var statusEl = document.getElementById('status')
var datetimeEl = document.getElementById('datetime')
var socEl = document.getElementById('soc')
var batteryEl = document.getElementById('battery')

function addSampleDataStatus(sample) {
  var sampleEl = document.getElementById('sample')

  if (!sample) {
    if (sampleEl) {
      sampleEl.remove()
    }
    return
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
  socEl.innerHTML = data.soc
  batteryEl.dataset.charge = data.battery_status

  datetimeEl.dataset.datetime = data.datetime
  datetimeEl.innerHTML = moment(datetimeEl.dataset.datetime).fromNow()
  
  addSampleDataStatus(data.sample)
})

window.setInterval(function() {
  datetimeEl.innerHTML = moment(datetimeEl.dataset.datetime).fromNow()
}, 60000)
