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

  if (!sample && sampleEl) {
    return sampleEl.remove()
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
var margin = {top: 5, right: 5, bottom: 20, left: 5}
var width = 500 - margin.left - margin.right
var height = 60 - margin.top - margin.bottom

var parseDate = d3.time.format('%Y%m%d%H%S').parse
var bisectDate = d3.bisector(function (d) { return d.date }).left
var formatDate = function (d) {
  return d.temperature + '°C on ' + moment(d.published_at).format('MMM DD, HH:mm:ss[h]')
}
var x = d3.time.scale()
  .range([0, width])

var y = d3.scale.linear()
  .range([height, 0])

var line = d3.svg.line()
  .interpolate('basis')
  .x(function(d) { return x(d.date) })
  .y(function(d) { return y(d.temperature) })

var svg = d3.select('#graph')
  .append('svg')
  .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

d3.json('/api', function(error, reply) {
  if (error) throw error

  var data = []

  reply.data.forEach(function(d) {
    var formatDate = moment(d.published_at).format('YYYYMMDDHHmm').toString()
    if (!d.sample) {
      data.push({
        date: parseDate(formatDate),
        temperature: +d.temperature,
        published_at: d.published_at
      })
    }
  })

  function drawGraph() {
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

    var focus = svg.append('g')
    .attr('class', 'focus')
    .style('display', 'block')
    .append('circle')
    .attr('r', 4)
    .style('display', 'none')

    var label = svg.append('text')
    .style('display', 'none')

    svg.append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on('mouseover', function () {
      focus.style('display', null)
      label.style('display', null)
    })
    .on('mouseout', function () {
      focus.style('display', 'none')
      label.style('display', 'none')
    })
    .on('mousemove', mousemove)

    function mousemove () {
      var x0 = x.invert(d3.mouse(this)[0])
      var i = bisectDate(data, x0, 1)
      var d0 = data[i - 1]
      var d1 = data[i]
      var d = x0 - d0.date > d1.date - x0 ? d1 : d0

      focus.attr('transform', 'translate(' + x(d.date) + ',' + y(d.temperature)  + ')')
      svg.select('text')
      .text(formatDate(d))
      .attr('class', 'label')
      .attr('dx', '2px')
      .attr('dy', '50px')
    }
  }

  drawGraph()

  socket.on('data', function(reply) {
    var formatDate = moment(reply.published_at).format('YYYYMMDDHHmm').toString()
    data.push({
      date: parseDate(formatDate),
      temperature: +reply.temperature
    })

    drawGraph()
  })
})
