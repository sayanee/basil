var socket = io.connect()

var statusEl = document.getElementById('status')
var datetimeEl = document.getElementById('datetime')
var socEl = document.getElementById('soc')
var batteryEl = document.getElementById('battery')
var sampleEl = document.getElementById('sample')

socket.on('data', function(data) {
  statusEl.innerHTML = data.status
  datetimeEl.innerHTML = data.datetime
  socEl.innerHTML = data.soc
  batteryEl.dataset.charge = data.battery_status

  if (data.sample) {
    sampleEl.innerHTML = 'sample data!'
  }
})
