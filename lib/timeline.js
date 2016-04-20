'use strict'

var config = require('../config')
var logger = require('../config/logger')
var moment = require('moment-timezone')
var initialMessage = 'Awaiting for the first sensor data...'

exports.setStatus = function(data, channel) {
  if (!data) {
    return initialMessage
  }

  var message = `My soil moisture is <strong>${data.soil_moisture}${config.meta.measurements.soil_moisture}</strong>, battery voltage is <strong>${data.battery_voltage}${config.meta.measurements.battery_voltage}</strong>.`

  if (data.battery_alert) {
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

  return `${stateOfCharge}${config.meta.measurements.battery_state_of_charge}`
}

exports.getBatteryStatus = function(stateOfCharge) {
  if (!stateOfCharge) {
    return initialMessage
  }

  return Math.floor((parseFloat(stateOfCharge) + 9) / 10)
}
