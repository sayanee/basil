if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

var logger = require('tracer').colorConsole()
var port = process.env.OPENSHIFT_NODE4_PORT || 1337
var ip = process.env.OPENSHIFT_NODE4_IP || '0.0.0.0'
var express = require('express')
var app = express()
var moment = require('moment-timezone')
var server = app.listen(port, ip, function () {
  console.log('Basil has started on http://localhost:' + port)
})
var request = require('request')
var config = require('./config')
var EventSource = require('eventsource')

var Firebase = require('firebase')
var db = new Firebase("https://blinding-inferno-4222.firebaseio.com/")

var channelName = 'basil'
var channel = config[ channelName ]
var api = {
  meta: {
    name: 'Basil',
    generated_at: '',
    timezone: config.timezone,
    utc: config.utc,
    units: channel.units,
    total_data: 0
  },
  data: {}
}
var viewData

db.authWithPassword({
  email: process.env.FIREBASE_EMAIL,
  password: process.env.FIREBASE_PASSWORD
}, function(error, userData) {
  if (error) {
    console.log('Error creating user:' + error)
    db.child('data').on('value', function(snapshot) {
      api.data = snapshot.val()
    })
  }
})

db.set(api)

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

  var message = 'My temperature is <strong>' + currentData.temperature + '°C</strong>, battery voltage is <strong>' + currentData.battery_voltage + 'V</strong>'

  if (currentData.alert) {
    message += ' Please charge your battery!'
  }

  return message
}

function getBatteryStatus(viewData) {
  if (!viewData) {
    return ''
  }

  if (viewData.state_of_charge < 20) {
    return ' low'
  } else if (viewData.state_of_charge > 75) {
    return ' full'
  } else {
    return ' med'
  }
}

function getPublishedDate(viewData) {
  if (!viewData) {
    return 'awaiting...'
  }

  return moment(viewData.published_at).tz(config.timezone).format('MMM D, h:mm a')
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
    console.log('Listening to Basil sensor now...')
  } ,false)

  eventSource.addEventListener('error', function(e) {
    console.log('Error on eventsource:')
    console.log(e)
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
      console.log(`${new Date()} Temp: ${temperature}C\tVoltage: ${batteryVoltage}V\tSOC: ${stateOfCharge}%\tAlert: ${batteryAlert}\tDebug: yes`)
    } else {
      console.log(`${new Date()} Temp: ${temperature}C\tVoltage: ${batteryVoltage}V\tSOC: ${stateOfCharge}%\tAlert: ${batteryAlert}`)
    }

    db.child('data').push().setWithPriority(newData, api.meta.total_data + 1)
    db.child('meta/total_data').transaction(function(reply) {
      api.meta.total_data = reply + 1
      return reply + 1
    })
    db.child('meta/generated_at').set(new Date())

    viewData = newData
    api.meta.generated_at = new Date()
    db.child('data').on('value', function(snapshot) {
      api.data = snapshot.val()
    })
  }, false)
}

app.use(express.static('public'))

app.get('/api', function(req, res){
  api.meta.generated_at = moment().tz(config.timezone).format()
  res.json(api)
})

app.get('/', function(req, res) {
  res.render('index.jade', {
    status: setStatus(viewData),
    datetime: getPublishedDate(viewData),
    soc: getSOC(viewData),
    battery_status: getBatteryStatus(viewData)
  })
})

listen(url())
