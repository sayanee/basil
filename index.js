if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

var logger = require('tracer').colorConsole()
var port = process.env.OPENSHIFT_NODE4_PORT || 1337
var ip = process.env.OPENSHIFT_NODE4_IP || '0.0.0.0'
var express = require('express')
var app = express()
var server = app.listen(port, ip, function () {
  console.log('Cosmic has started on http://localhost:' + port)
})
var request = require('request')
var config = require('./config')
var dataStore = []
var EventSource = require('eventsource')

var channelName = 'basil'
var channel = config[ channelName ]
var api = {
  meta: {
    name: 'Basil',
    generated_at: undefined,
    units: channel.units
  },
  data: dataStore
}

function url() {
  return channel.baseUrl + process.env.DEVICE_ID + '/events?access_token=' + process.env.ACCESS_TOKEN
}

function normaliseTemperature(value) {
  return formatOneDecimalPlace((value / 4096 * 3.3) * 100)
}

function formatOneDecimalPlace(value) {
  return Math.round( value * 10) / 10
}

function query(newClient) {
  var eventSource = new EventSource(url())
  eventSource.addEventListener('open', function(e) {
    console.log('Listening to Basil now...');
  } ,false)

  eventSource.addEventListener('error', function(e) {
    console.log(`Error: ${e}`);
  } ,false);

  eventSource.addEventListener('basil', function(e) {
    var payload = JSON.parse(e.data)
    var publishedAt = payload.published_at
    var data = JSON.parse(payload.data)

    var temperature = normaliseTemperature(data.temperature)
    var batteryVoltage = formatOneDecimalPlace(data.voltage)
    var stateOfCharge = formatOneDecimalPlace(data.soc)
    var batteryAlert = data.alert ? true : false

    dataStore.push({
      published_at: publishedAt,
      temperature: temperature,
      battery_voltage: batteryVoltage,
      state_of_charge: stateOfCharge,
      battery_alert: batteryAlert
    })
    api.meta.generated_at = new Date()

    console.log(`${new Date()} Temperature: ${temperature}\tBattery voltage: ${batteryVoltage}\tState of Charge: ${stateOfCharge}\tBatt alert: ${batteryAlert}`)
  }, false)
}

app.use(express.static('public'))
app.get('/api', function(req, res){
  res.json(api)
})

query()
