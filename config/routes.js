'use strict'

var moment = require('moment-timezone')
var channel = require('../models/channelModel')
var logger = require('../config/logger')
const CHANNEL_NAME = 'basil'

module.exports = function(app) {
  app.get('/', function(req, res) {
    channel.last(CHANNEL_NAME, function(renderData) {
      renderData.debug = false
      res.render('index', renderData)
    })
  })

  app.get('/api', function(req, res) {
    channel.index(CHANNEL_NAME, function(list) {
      res.json(list)
    })
  })
}
