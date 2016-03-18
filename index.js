if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

var port = process.env.OPENSHIFT_NODE4_PORT || 1337
var ip = process.env.OPENSHIFT_NODE4_IP || '0.0.0.0'
var logger = require('./config/logger')
var db = require('./config/database')

var express = require('express')
var app = express()
var moment = require('moment-timezone')
var request = require('request')
var morgan = require('morgan')

var config = require('./config')
var EventSource = require('eventsource')

var channelName = 'basil'
var channel = config[ channelName ]
var api = {
  meta: {
    name: 'Basil',
    timezone: config.timezone,
    utc: config.utc,
    units: channel.units,
    total_data: 0
  }
}
var viewData

var server = app.listen(port, ip, function () {
  logger.info('Basil has started on http://localhost:' + port)
  db.child('data').on('value', function(snapshot) {
    api.data = snapshot.val()
  })

  db.child('meta').on('value', function(snapshot) {
    api.meta = snapshot.val()
  })
})


function url() {
  return channel.baseUrl + process.env.DEVICE_ID + '/events?access_token=' + process.env.ACCESS_TOKEN
}

function normaliseTemperature(value) {
  return formatOneDecimalPlace((value / 4096 * 3.3) * 100)
}

function formatOneDecimalPlace(value) {
  return Math.round( value * 10) / 10
}

function setStatus(currentData) {
  if (!currentData) {
    return 'Waiting for data...'
  }

  var message = `My temperature is <strong>${currentData.temperature}${config[ channelName ].units.temperature}</strong>, battery voltage is <strong>${currentData.battery_voltage}${config[ channelName ].units.battery_voltage}</strong>`

  if (currentData.alert) {
    message += ' Please charge your battery!'
  }

  return message
}

function getBatteryStatus(stateOfCharge) {
  return Math.floor((parseFloat(stateOfCharge) + 9) / 10)
}

function getPublishedDate(viewData) {
  if (!viewData) {
    return 'awaiting...'
  }

  return moment(new Date(viewData.published_at)).tz(config.timezone).format('MMM D, h:mm a')
}

function getSOC(viewData) {
  if (!viewData) {
    return 'awaiting...'
  }

  return `Battery ${viewData.state_of_charge}%`
}

function listen(url) {
  var eventSource = new EventSource(url)
  eventSource.addEventListener('open', function(e) {
    logger.info('Listening to Basil sensor now...')
  } ,false)

  eventSource.addEventListener('error', function(e) {
    logger.error(e)
  } ,false);

  eventSource.addEventListener('basil', function(e) {
    var payload = JSON.parse(e.data)
    var publishedAt = payload.published_at
    var data = JSON.parse(payload.data)

    var temperature = normaliseTemperature(data.temperature)
    var batteryVoltage = formatOneDecimalPlace(data.voltage)
    var stateOfCharge = formatOneDecimalPlace(data.soc)
    var batteryAlert = data.alert ? true : false
    var newData = {
      published_at: moment(publishedAt).tz(config.timezone).toString(),
      temperature: temperature,
      battery_voltage: batteryVoltage,
      state_of_charge: stateOfCharge,
      battery_alert: batteryAlert
    }

    if (data.debug) {
      newData.debug = data.debug
      logger.info(`${new Date()} Temp: ${temperature}${config.units.temperature}\tVoltage: ${batteryVoltage}${config.units.battery_voltage}\tSOC: ${stateOfCharge}${config.units.battery_status}\tAlert: ${batteryAlert}\tDebug: yes`)
    } else {
      logger.info(`${new Date()} Temp: ${temperature}C\tVoltage: ${batteryVoltage}V\tSOC: ${stateOfCharge}%\tAlert: ${batteryAlert}`)
    }

    api.meta.total_data += 1
    db.child('data').child(api.meta.total_data).setWithPriority(newData, api.meta.total_data)
    db.child('meta/total_data').transaction(function(reply) {
      return api.meta.total_data
    })

    viewData = newData
    db.child('data').on('value', function(snapshot) {
      api.data = snapshot.val()
    })
  }, false)

  if (process.argv[2] === 'debug') {
    setInterval(function() {
      var newData = {
        published_at: moment().tz(config.timezone).toString(),
        temperature: '29.4',
        battery_voltage: '3.5',
        state_of_charge: '89',
        battery_alert: false,
        debug: true
      }

      logger.info(`${new Date()} Temp: ${newData.temperature}${config[channelName].units.temperature}\tVoltage: ${newData.battery_voltage}${config[channelName].units.battery_voltage}\tSOC: ${newData.state_of_charge}${config[channelName].units.state_of_charge}\tAlert: ${newData.battery_alert}\tDebug: yes`)

      api.meta.total_data += 1
      db.child('data').child(api.meta.total_data).setWithPriority(newData, api.meta.total_data)
      db.child('meta/total_data').transaction(function(reply) {
        return api.meta.total_data
      })

      viewData = newData
      db.child('data').on('value', function(snapshot) {
        api.data = snapshot.val()
      })
    }, 5000)
  }
}

app.use(express.static('public'))
app.set('view engine', 'jade')
app.use(morgan('log: \t:date[clf] :method :url, HTTP :http-version, :response-time ms, Status::status, Ref::referrer, Req header::req[header], Res header::res[header], Remote add::remote-addr'))

app.get('/api', function(req, res){
  api.meta.generated_at = moment().tz(config.timezone).format()
  res.json(api)
})

app.get('/', function(req, res) {
  var renderData = api.data[ api.meta.total_data ]

  res.render('index.jade', {
    status: setStatus(renderData),
    datetime: getPublishedDate(renderData),
    soc: getSOC(renderData),
    battery_status: getBatteryStatus(renderData.state_of_charge),
    debug: renderData.debug
  })
})

listen(url())
