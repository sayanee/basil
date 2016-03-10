if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

var logger = require('tracer').colorConsole()
var port = process.env.OPENSHIFT_NODE4_PORT || 1337
var ip = process.env.OPENSHIFT_NODE4_IP || '0.0.0.0'
var express = require('express')
var app = express()
var server = app.listen(port, ip, function () {
  console.log('App running on ' + port)
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
    soc: undefined,
    battery_voltage: undefined,
    battery_charge_required: undefined,
    units: channel.units
  },
  config: {
    trigger: config[ channelName ].trigger,
    change: config[ channelName ].change
  },
  basil: dataStore
}

function url() {
  return channel.baseUrl + process.env.DEVICE_ID + '/events?access_token=' + process.env.ACCESS_TOKEN
}

function normaliseTemperature(value) {
  return (value / 4096 * 3.3) * 100
}

function query(newClient) {
  var eventSource = new EventSource(url())
  eventSource.addEventListener('open', function(e) {
    console.log('Listening to LM35 Temperature sensor now...');
  } ,false)

  eventSource.addEventListener('error', function(e) {
    console.log(`Error: ${e}`);
  } ,false);

  eventSource.addEventListener('temperature', function(e) {
    console.log(`\n\nNew value from the sensor at ${new Date()}`)

    var temperature = normaliseTemperature(JSON.parse(e.data).data)
    console.log(`Temperature: ${temperature}`)
    dataStore.push({
      value: temperature,
      datetime: new Date()
    })
  }, false)

  eventSource.addEventListener('soc', function(e) {
    var soc = JSON.parse(e.data).data
    console.log(`State of Charge: ${soc}`)
    api.meta.soc = soc
  }, false)

  eventSource.addEventListener('voltage', function(e) {
    var voltage = JSON.parse(e.data).data
    console.log(`Voltage: ${voltage}`)
    api.meta.battery_voltage = voltage
  }, false)

  eventSource.addEventListener('alert', function(e) {
    var alert = parseInt(JSON.parse(e.data).data) ? true : false
    console.log(`Alert: ${alert}`)
    api.meta.battery_charge_required = alert
  }, false)
}

app.use(express.static('public'))
app.get('/api', function(req, res){
  res.json(api)
})

query()
