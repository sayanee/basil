var socket = io.connect()

socket.on('data', function(data) {
  document.getElementById('status').innerHTML = data.status
  document.getElementById('datetime').innerHTML = data.datetime
  document.getElementById('soc').innerHTML = data.soc
  document.getElementById('battery').dataset.charge = data.battery_status

  if (data.sample) {
    document.getElementById('sample').innerHTML = 'sample data!'
  }
})
