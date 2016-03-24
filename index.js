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
  logger.info('Basil has started on http://localhost:' + port)
  routes(app)
})

var moment = require('moment-timezone')
var EventSource = require('eventsource')
var io = require('socket.io').listen(server)
var sockets = []

const CHANNEL_NAME = 'basil'
var channel = config[ CHANNEL_NAME ]
var api = {}
api[ CHANNEL_NAME ] =  {
  meta: {
    name: 'basil',
    description: 'measure soil moisture and temperature for a basil plant',
    timezone: config.timezone,
    utc: config.utc,
    units: channel.units,
    last_data_id: 0
  }
}

app.use(express.static('public'))
app.set('view engine', 'jade')
app.use(morgan('log: \t:date[clf] :method :url, HTTP :http-version, :response-time ms, Status::status, Ref::referrer, Req header::req[header], Res header::res[header], Remote add::remote-addr'))

function url() {
  return channel.baseUrl + process.env.DEVICE_ID + '/events?access_token=' + process.env.ACCESS_TOKEN
}

function normaliseTemperature(value) {
  return formatOneDecimalPlace((value / 4096 * 3.3) * 100)
}

function formatOneDecimalPlace(value) {
  return Math.round( value * 10) / 10
}

function getSensorValues(sample, sensor) {
  if (sample) {
    var randomSubstract = Math.round((Math.random() * 11 + 1)/10)
    return {
      published_at: moment(new Date()).toISOString(),
      temperature: 29.4 - randomSubstract,
      battery_voltage: 3.5 - randomSubstract,
      battery_state_of_charge: 89 - randomSubstract,
      battery_alert: false,
      sample: 'sample data!'
    }
  }

  var payload = JSON.parse(sensor.data)
  var data = JSON.parse(payload.data)

  return {
    published_at: moment(payload.published_at).toISOString(),
    temperature: normaliseTemperature(data.temperature),
    battery_voltage: formatOneDecimalPlace(data.voltage),
    battery_state_of_charge: formatOneDecimalPlace(data.soc),
    battery_alert: data.alert ? true : false,
    sample: data.sample ? 'sample data!' : ''
  }
}

function logData(data, channel) {
  var log = `${new Date()} Temp: ${data.temperature}${config[ channel ].units.temperature}\tVoltage: ${data.battery_voltage}${config[ channel ].units.battery_voltage}\tSOC: ${data.battery_state_of_charge}${config[ channel ].units.battery_state_of_charge} \tBatt alert: ${data.battery_alert}`

  data.sample ? logger.info(log + '\tSample: yes') : logger.info(log)
}

function storeDB(lastData) {
  db.child(CHANNEL_NAME + '/meta/last_data_id').once('value', function(snapshot) {
    var lastDataID = snapshot.val() + 1
    lastData.id = lastDataID

    db.child(CHANNEL_NAME + '/data/' + lastDataID).set(lastData, function(error) {
      if (error) {
        logger.error(error)
      } else {
        db.child(CHANNEL_NAME + '/meta/last_data_id').set(lastDataID)
      }
    })
  })

  sockets.forEach(function(eachSocket, index) {
    eachSocket.emit('data', {
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
  } ,false);

  eventSource.addEventListener(channel, function(e) {
    logger.trace(e)
    const lastData = getSensorValues(false, e)
    logData(lastData, CHANNEL_NAME)
    storeDB(lastData)
  }, false)

  if (process.argv[2] === 'sample') {
    setInterval(function() {
      const lastData = getSensorValues(true)
      logData(lastData, CHANNEL_NAME)
      storeDB(lastData)
    }, 5000)
  }
}

io.on('connection', function (reply) {
  sockets.push(reply)
})

listen(url(), CHANNEL_NAME)
