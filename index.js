if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
var port = process.env.OPENSHIFT_NODE4_PORT || 1337
var ip = process.env.OPENSHIFT_NODE4_IP || '0.0.0.0'
var express = require('express')
var app = express()
var server = app.listen(port, function () {
  console.log('App running on ' + port);
});
var io = require('socket.io').listen(server)
var request = require('request')
var config = require('./config')
var dataStore = [];
var sockets = [];

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
    var textChunk = chunk.toString('utf8');
    var result = JSON.parse(textChunk).result
    var message = result + ' at ' + new Date()

    console.log(newClient === true ? message + ' New client found!' : message)

    dataStore.push({
      data: result,
      date: new Date()
    })

    sockets.forEach(function(eachSocket) {
      eachSocket.emit(channelName, result)
    })
  })
}

app.use(express.static('public'))
app.get('/api', function(req, res){
  res.json({
    basil: dataStore
  });
})

io.on('connection', function (socket) {
  sockets.push(socket)
  var lastData;

  if (dataStore.length > 0) {
    lastData = dataStore[ dataStore.length - 1 ].data
    socket.emit(channelName, lastData)
  }
});

query()
setInterval(function() {
  query()
}, channel.interval)
