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
var io = require('socket.io').listen(server)
var request = require('request')
var config = require('./config')
var dataStore = []
var sockets = []

var channelName = 'basil'
var channel = config[ channelName ]

function url() {
  return channel.baseUrl + process.env.DEVICE_ID + channel.variableName + '?access_token=' + process.env.ACCESS_TOKEN
}

function query(newClient) {
  request({
    uri: url(),
    method: 'GET'
  }).on('error', function(err) {
    console.log(err)
  }).on('data', function (chunk) {
    var textChunk = chunk.toString('utf8')
    var currResult

    if (textChunk) {
      try {
        currResult = JSON.parse(textChunk).result
      } catch(error) {
        logger.error(error)
      }
    }

    var prevResult = dataStore.length > 0 ? dataStore[ dataStore.length - 1 ].data : 0
    var message = currResult + ' at ' + new Date()

    console.log(newClient === true ? message + ' New client found!' : message)

    sockets.forEach(function(eachSocket) {
      eachSocket.emit(channelName, currResult)
    })

    dataStore.push({
      data: currResult,
      date: new Date()
    })
  })
}

app.use(express.static('public'))
app.get('/api', function(req, res){
  res.json({
    config: {
      trigger: config[ channelName ].trigger,
      change: config[ channelName ].change
    },
    basil: dataStore
  })
})

io.on('connection', function (socket) {
  sockets.push(socket)

  if (dataStore.length > 0) {
    socket.emit('init', {
      config: {
        trigger: config[ channelName ].trigger,
        change: config[ channelName ].change
      },
      basil: dataStore
    })
  }
})

query()
setInterval(function() {
  query()
}, channel.interval)
