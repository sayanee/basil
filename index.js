if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

var config = require('./config')
var logger = require('./config/logger')
var db = require('./config/database')
var routes = require('./config/routes')
var timeline = require('./lib/timeline')

var port = process.env.OPENSHIFT_NODE4_PORT || 1337
var ip = process.env.OPENSHIFT_NODE4_IP || '0.0.0.0'
var express = require('express')
var app = express()

var morgan = require('morgan')
var server = app.listen(port, ip, function () {
  logger.info(`Basil has started on http://${ip}:${port}`)
  routes(app)
})

var moment = require('moment-timezone')
var EventSource = require('eventsource')
var io = require('socket.io').listen(server)
var sockets = []

const CHANNEL_NAME = 'basil'
var channel = config.channels[ CHANNEL_NAME ]
var api = {}
api[ CHANNEL_NAME ] =  {
  meta: {
    name: 'basil',
    description: 'measure soil moisture and temperature for a basil plant',
    timezone: config.meta.timezone,
    utc: config.meta.utc,
    measurements: config.meta.measurements,
    last_data_id: 0
  }
}

app.use(express.static('public'))
app.set('view engine', 'jade')
app.use(morgan('log: \t:date[web] :method :url, :response-time ms, Status::status, Ref::referrer, Req header::req[header], Res header::res[header], Remote add::remote-addr, User agent::user-agent'))

function url() {
  return config.channels[ CHANNEL_NAME ].baseUrl + process.env.DEVICE_ID + '/events?access_token=' + process.env.ACCESS_TOKEN
}

function normaliseTemperature(value) {
  return formatOneDecimalPlace((value / 4096 * 3.3) * 100)
}

function formatOneDecimalPlace(value) {
  return Math.round( value * 10) / 10
}

function currentDatetimeISO() {
  return moment(new Date()).toISOString()
}

function getSensorValues(sample, sensor) {
  if (sample) {
    var randomSubstract = Math.round((Math.random() * 11 + 1)/10)
    return {
      published_at: currentDatetimeISO(),
      temperature: 29.4 - randomSubstract,
      battery_voltage: 4.2,
      battery_state_of_charge: 100,
      battery_alert: false,
      sample: 'This is a sample sensor value.'
    }
  }

  var payload = JSON.parse(sensor.data)
  var data = JSON.parse(payload.data)

  var json = {
    published_at: moment(payload.published_at).toISOString(),
    temperature: normaliseTemperature(data.temperature),
    battery_voltage: formatOneDecimalPlace(data.voltage),
    battery_state_of_charge: formatOneDecimalPlace(data.soc),
    battery_alert: data.alert ? true : false
  }

  if (!data.sample) {
    return json
  } else {
    json.sample = 'This is a debug sensor value logged every 10 seconds.'
    return json
  }
}

function logData(data, channel) {
  var log = `${CHANNEL_NAME} update - Temperature: ${data.temperature}${config.meta.measurements.temperature}\tVoltage: ${data.battery_voltage}${config.meta.measurements.battery_voltage}\tSOC: ${data.battery_state_of_charge}${config.meta.measurements.battery_state_of_charge} \tBatt alert: ${data.battery_alert}`

  data.sample ? logger.info(log + '\tSample: yes') : logger.info(log)
}

function storeDB(lastData) {
  db.child(CHANNEL_NAME + '/meta/last_data_id').once('value', function(snapshot) {
    var lastDataID = snapshot.val()

    db.child(CHANNEL_NAME + '/data/' + lastDataID).once('value', function(snapshot) {
      if (lastData.published_at !== snapshot.val().published_at
        && lastData.temperature !== snapshot.val().temperature) {

        lastDataID += 1
        lastData.id = lastDataID

        db.child(CHANNEL_NAME + '/data/' + lastDataID).set(lastData, function(error) {
          if (error) {
            logger.error(error)
          } else {
            db.child(CHANNEL_NAME + '/meta/last_data_id').set(lastDataID)
            db.child(CHANNEL_NAME + '/meta/published_at').set(currentDatetimeISO())
          }
        })
      }
    })
  })

  sockets.forEach(function(eachSocket, index) {
    eachSocket.emit('data', {
      temperature: lastData.temperature,
      published_at: lastData.published_at,
      status: timeline.setStatus(lastData, CHANNEL_NAME),
      datetime: timeline.getPublishedDate(lastData.published_at),
      soc: timeline.getSOC(lastData.battery_state_of_charge, CHANNEL_NAME),
      battery_status: timeline.getBatteryStatus(lastData.battery_state_of_charge),
      sample: lastData.sample
    })
  })
}

function listen(url, channel) {
  var eventSource = new EventSource(url)
  eventSource.addEventListener('open', function(e) {
    logger.info(`Listening to ${channel} sensor now...`)
  } ,false)

  eventSource.addEventListener('error', function(e) {
    logger.error(e)
    logger.error(`State: ${eventSource.readyState}, URL: ${eventSource.url} - Restarting EventSource`)

    eventSource.close()
    listen(url, channel)
  } ,false);

  eventSource.addEventListener(channel, function(e) {
    const lastData = getSensorValues(false, e)
    logData(lastData, CHANNEL_NAME)
    storeDB(lastData)
  }, false)

  if (process.argv[2] === 'sample') {
    setInterval(function() {
      const lastData = getSensorValues(true)
      logData(lastData, CHANNEL_NAME)
      storeDB(lastData)
    }, 10000)
  }
}

io.on('connection', function (socket) {
  sockets.push(socket)

  socket.on('disconnect', function() {
    var i = sockets.indexOf(socket)
    sockets.splice(i, 1)
  })
})

listen(url(), CHANNEL_NAME)
