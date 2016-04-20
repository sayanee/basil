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
var sampleEl = document.getElementById('sample')

function addSampleDataStatus(sample) {
  if (!sample) {
    if (sampleEl) {
      sampleEl.remove()
    }
    return
  }

  var sampleText = 'sample'

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
}, 600000) // every 10 minutes

// plot graph
var margin = {top: 5, right: 5, bottom: 20, left: 5}
var width = 500 - margin.left - margin.right
var height = 60 - margin.top - margin.bottom

var parseDate = d3.time.format('%Y%m%d%H%S').parse
var bisectDate = d3.bisector(function (d) { return d.date }).left
var formatLabel = function (d) {
  return d.soil_moisture + '% on ' + moment(d.published_at).format('MMM DD, HH:mm:ss[h]')
}
var formatDate = function(publishedAt) {
  return moment(publishedAt).format('YYYYMMDDHHmm').toString()
}
var x = d3.time.scale().range([0, width])
var y = d3.scale.linear().range([height, 0])

var line = d3.svg.line()
  .interpolate('basis')
  .x(function(d) { return x(d.date) })
  .y(function(d) { return y(d.soil_moisture) })

var svg = d3.select('#graph')
  .append('svg')
  .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

function drawGraph(data) {
  x.domain([data[0].date, data[data.length - 1].date]);
  y.domain(d3.extent(data, function(d) { return d.soil_moisture }))

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

    if (!d0 || !d1) {
      return
    }

    var d = x0 - d0.date > d1.date - x0 ? d1 : d0

    focus.attr('transform', 'translate(' + x(d.date) + ',' + y(d.soil_moisture)  + ')')
    svg.select('text')
    .text(formatLabel(d))
    .attr('class', 'label')
    .attr('dx', '2px')
    .attr('dy', '50px')
  }
}

var data = []

d3.json('/api', function(error, reply) {
  if (error) throw error

  reply.data.forEach(function(d) {

    if (d && !d.sample) {
      data.push({
        date: parseDate(formatDate(d.published_at)),
        soil_moisture: +d.soil_moisture,
        published_at: d.published_at
      })
    }
  })

  drawGraph(data)

  socket.on('data', function(reply) {
    data.push({
      date: parseDate(formatDate(reply.published_at)),
      soil_moisture: +reply.soil_moisture,
      published_at: reply.published_at
    })

    drawGraph(data)
  })
})
