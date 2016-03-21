'use strict'

var db = require('../config/database')
var timeline = require('../lib/timeline')
var logger = require('../config/logger')

class Channel {
  constructor(list) {
    this.list = list
  }

  index(channel, callback) {
    var list = {}

    db.child(channel + '/meta').once('value', function(snapshot) {
      list.meta = snapshot.val()

      db.child(channel + '/data').once('value', function(snapshot) {
        list.data = snapshot.val()
        callback(list)
      })
    })
  }

  last(channel, callback) {
    var lastData
    var lastDataID
    var awaitingMessage = 'Waiting for data...'

    db.child(channel + '/meta/last_data_id').once('value', function(snapshot) {
      lastDataID = snapshot.val()

      db.child(channel + '/data/' + lastDataID).once('value', function(snapshot) {
        lastData = snapshot.val()

        callback({
          status: timeline.setStatus(lastData, channel) || awaitingMessage,
          datetime: timeline.getPublishedDate(lastData.published_at) || awaitingMessage,
          soc: timeline.getSOC(lastData.state_of_charge, channel) || awaitingMessage,
          battery_status: timeline.getBatteryStatus(lastData.state_of_charge),
          sample: lastData.sample
        })
      })
    })
  }
}

module.exports = new Channel()
