'use strict'

var db = require('../config/database')
var timeline = require('../lib/timeline')
var logger = require('../config/logger')


class Channel {
  constructor(list) {
    this.list = list
  }

  index(callback) {
    var list = {}

    db.child('meta').on('value', function(snapshot) {
      list.meta = snapshot.val()

      db.child('data').on('value', function(snapshot) {
        list.data = snapshot.val()
        callback(list)
      })
    })
  }

  last(channel, callback) {
    var lastData
    var lastDataIndex
    var awaitingMessage = 'Waiting for data...'

    db.child('meta/total_data').on('value', function(snapshot) {
      lastDataIndex = snapshot.val()

      db.child('data').on('value', function(snapshot) {
        lastData = snapshot.val()[ lastDataIndex ]
        callback({
          status: timeline.setStatus(lastData, channel) || awaitingMessage,
          datetime: timeline.getPublishedDate(lastData.published_at) || awaitingMessage,
          soc: timeline.getSOC(lastData.state_of_charge, channel) || awaitingMessage,
          battery_status: timeline.getBatteryStatus(lastData.state_of_charge),
          debug: lastData.debug
        })
      })
    })
  }
}

module.exports = new Channel()
