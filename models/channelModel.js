'use strict'

var db = require('../config/database')
var timeline = require('../lib/timeline')
var logger = require('../config/logger')
var config = require('../config')
var moment = require('moment-timezone')
var twoWeeksAgo = moment().subtract('weeks', 2).format()
var _ = require('lodash')

function isMoreThan2WeeksOld(value) {
  return moment().diff(value.published_at, 'days') < 15
}

class Channel {
  index(channel, callback) {
    var list = {}

    db.child(channel + '/meta').once('value', function(snapshot) {
      list.meta = snapshot.val()

      db.child(channel + '/data')
      .orderByChild('published_at')
      .once('value', function(snapshot) {
        if (snapshot.val().length < 1) {
          list.data = []
        } else {
          list.data = _.compact(snapshot.val().filter(isMoreThan2WeeksOld)) || {}
        }

        callback(list)
      })
    })
  }

  last(channel, callback) {
    var lastData
    var lastDataID

    db.child(channel + '/meta/last_data_id').once('value', function(snapshot) {
      lastDataID = snapshot.val()

      db.child(channel + '/data/' + lastDataID).once('value', function(snapshot) {
        lastData = snapshot.val()

        if (!lastData) {
          var initialMessage = 'Waiting for the first data!'
          return callback({
            status: initialMessage,
            datetime: timeline.getPublishedDate(),
            datetime_relative: initialMessage,
            soc: initialMessage,
            battery_status: initialMessage
          })
        }

        return callback({
          status: timeline.setStatus(lastData, channel),
          datetime: timeline.getPublishedDate(lastData.published_at),
          datetime_relative: moment(timeline.getPublishedDate(lastData.published_at)).fromNow(),
          soc: timeline.getSOC(lastData.battery_state_of_charge, channel),
          battery_status: timeline.getBatteryStatus(lastData.battery_state_of_charge),
          sample: lastData.sample,
          need_charge: lastData.battery_alert,
          need_water: false
        })
      })
    })
  }
}

module.exports = new Channel()
