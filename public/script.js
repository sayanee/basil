function addListItem(data, date, status) {
  var entry = document.createElement('li');
  entry.innerHTML = setMessage(data, date, status)

  list.insertBefore(entry, list.firstChild);
  setTimeout(function() {
    entry.className = entry.className + ' show ' + setIndicatorLevel(data, status);
  }, 10);
}

function setMessage(data, date, status) {
  var normData = Math.round((data + 1) / 4096 * 100)
  var message = 'My soil moisture is <strong>' + normData + '%</strong>'
  var dateMessage = '<span>' + moment(date).format('MMM D, h:mm a') + '</span>'

  if (!data) {
    return 'Oops! Looks like I am not connected to the Internet. You want to check?' + dateMessage
  }

  if (data < config.trigger) {
    return 'Please water me! My soil moisture is below <em>2500</em> at <strong>' + data + '</strong>' + dateMessage
  }

  if (status === 'changed') {
    return 'Yay! I have been watered. ' + message + dateMessage
  }

  return message + dateMessage
}

function setIndicatorLevel(data, status) {
  if (!data) return 'warn'
  if (data < config.trigger) return 'info'
  if (status === 'changed') return 'success'
  return ''
}

function getLastDefinedValue(currentIndex, array) {
  let trackIndex = currentIndex
  let definedValue

  while (trackIndex > 0 && !definedValue) {
    trackIndex--
    definedValue = array[ trackIndex ].data
  }

  return definedValue
}

var channel = 'basil'
var list = document.getElementById('list')
var socket = io.connect()
var dataStore = []
var config = {}

socket.on('init', function(data) {
  dataStore = data[ channel ]
  config = data.config

  return dataStore.forEach(function(eachData, index) {
    if (index > 0 && (eachData.data - getLastDefinedValue(index, dataStore) > config.change)) {
      addListItem(parseInt(eachData.data), eachData.date, 'changed')
    } else {
      addListItem(parseInt(eachData.data), eachData.date)
    }
  })
})

socket.on(channel, function(data) {
  // addListItem(data, new Date())
});
