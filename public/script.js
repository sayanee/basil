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
  // socEl.innerHTML = data.soc // soc is a hidden element that is displayed on hover
  batteryEl.dataset.charge = data.battery_status

  datetimeEl.dataset.datetime = data.datetime
  datetimeEl.innerHTML = moment(datetimeEl.dataset.datetime).fromNow()

  addSampleDataStatus(data.sample)
})

window.setInterval(function() {
  datetimeEl.innerHTML = moment(datetimeEl.dataset.datetime).fromNow()
}, 60000)

// plot graph
var margin = {top: 5, right: 5, bottom: 5, left: 5}
var width = 500 - margin.left - margin.right
var height = 50 - margin.top - margin.bottom

var parseDate = d3.time.format('%Y%m%d%H%S').parse

var x = d3.time.scale()
  .range([0, width])

var y = d3.scale.linear()
  .range([height, 0])

var line = d3.svg.line()
  .interpolate('basis')
  .x(function(d) { return x(d.date); })
  .y(function(d) { return y(d.temperature); })

var svg = d3.select('#graph')
  .append('svg')
  .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

d3.json('/api', function(error, reply) {
  if (error) throw error;

  reply.data.forEach(function(d) {
    var formatDate = moment(d.published_at).format('YYYYMMDDHHmm').toString()

    d.date = parseDate(formatDate)
    d.temperature = +d.temperature
  })

  var data = reply.data

  x.domain([data[0].date, data[data.length - 1].date]);
  y.domain(d3.extent(data, function(d) { return d.temperature }))

  var limit = y(29)

  svg.append('clipPath')
  .attr('id', 'clip-above')
  .append('rect')
  .attr('width', width)
  .attr('height', limit)

  svg.append('clipPath')
  .attr('id', 'clip-below')
  .append('rect')
  .attr('y', limit)
  .attr('width', width)
  .attr('height', height - limit)

  svg.selectAll('.line')
  .data(['above', 'below'])
  .enter().append('path')
  .attr('class', function(d) { return 'line ' + d; })
  .attr('clip-path', function(d) { return 'url(#clip-' + d + ')'; })
  .datum(data)
  .attr('d', line)
})
