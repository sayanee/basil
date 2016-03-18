'use strict'

var logger = require('tracer')

module.exports = logger.colorConsole({
  format: '{{title}}: \t{{timestamp}} ({{path}}:{{line}}:{{pos}}) {{message}}',
  dateformat: 'dd mmm HH:MM:ss',
  preprocess:  function(data) {
    data.path = data.path.replace(process.cwd(), '');
  }
})
