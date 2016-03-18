'use strict'

var moment = require('moment-timezone')
var channel = require('../models/channelModel')

module.exports = function(app) {
  app.get('/', function(req, res) {
    channel.last('basil', function(renderData) {
      res.render('index.jade', renderData)
    })
  })

  app.get('/api', function(req, res) {
    channel.index(function(list) {
      res.json(list)
    })
  })
}
