'use strict'

var config = require('../config')
var logger = require('../config/logger')
var moment = require('moment-timezone')
var initialMessage = 'Awaiting for the first sensor data...'

exports.setStatus = function(data, channel) {
  if (!data) {
    return initialMessage
  }

  var message = `My temperature is <strong>${data.temperature}${config[ channel ].units.temperature}</strong>, battery voltage is <strong>${data.battery_voltage}${config[ channel ].units.battery_voltage}</strong>`

  if (data.alert) {
    message += ' Please charge your battery!'
  }

  return message
}

exports.getPublishedDate = function(publishedAt) {
  if (!publishedAt) {
    return initialMessage
  }

  return moment(new Date(publishedAt)).tz(config.timezone).format('MMM D, h:mm a')
}

exports.getSOC = function(stateOfCharge, channel) {
  if (!stateOfCharge) {
    return initialMessage
  }

  return `Battery ${stateOfCharge}${config[ channel ].units.battery_state_of_charge}`
}

exports.getBatteryStatus = function(stateOfCharge) {
  if (!stateOfCharge) {
    return initialMessage
  }
  
  return Math.floor((parseFloat(stateOfCharge) + 9) / 10)
}
