'use strict'

var config = require('../config')
var logger = require('../config/logger')
var moment = require('moment-timezone')

exports.setStatus = function(data, channel) {
  var message = `My temperature is <strong>${data.temperature}${config[ channel ].units.temperature}</strong>, battery voltage is <strong>${data.battery_voltage}${config[ channel ].units.battery_voltage}</strong>`

  if (data.alert) {
    message += ' Please charge your battery!'
  }

  return message
}

exports.getPublishedDate = function(publishedAt) {
  return moment(new Date(publishedAt)).tz(config.timezone).format('MMM D, h:mm a')
}

exports.getSOC = function(stateOfCharge, channel) {
  return `Battery ${stateOfCharge}${config[ channel ].units.state_of_charge}`
}

exports.getBatteryStatus = function(stateOfCharge) {
  return Math.floor((parseFloat(stateOfCharge) + 9) / 10)
}
