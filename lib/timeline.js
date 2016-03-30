'use strict'

var config = require('../config')
var logger = require('../config/logger')
var moment = require('moment-timezone')
var initialMessage = 'Awaiting for the first sensor data...'

exports.setStatus = function(data, channel) {
  if (!data) {
    return initialMessage
  }

  var message = `My temperature is <strong>${data.temperature}${config.meta.measurements.temperature}</strong>, battery voltage is <strong>${data.battery_voltage}${config.meta.measurements.battery_voltage}</strong>`

  if (data.alert) {
    message += ' Please charge your battery!'
  }

  return message
}

exports.getPublishedDate = function(publishedAt) {
  var date
  !publishedAt ? date = new Date() : date = new Date(publishedAt)

  return moment(date).toISOString()
}

exports.getSOC = function(stateOfCharge, channel) {
  if (!stateOfCharge) {
    return initialMessage
  }

  return `${stateOfCharge}${config.meta.measurements.battery_state_of_charge} left`
}

exports.getBatteryStatus = function(stateOfCharge) {
  if (!stateOfCharge) {
    return initialMessage
  }

  return Math.floor((parseFloat(stateOfCharge) + 9) / 10)
}
