module.exports = {
  "meta": {
    "utc": "+0800",
    "timezone": "Asia/Singapore",
    "sampleInterval": 10000,
    "measurements": {
      "temperature": "°C",
      "soil_moisture": "%",
      "battery_voltage": "V",
      "battery_state_of_charge": "%",
      "published_at": "ISO 8601 Date and time in UTC"
    }
  },
  "channels": {
    "basil": {
      "name": "basil",
      "owner": "sayanee",
      "baseUrl": 'https://api.particle.io/v1/devices/',
      "trigger": {
        "soil_moisture": 50
      },
      "changed": {
        "soil_moisture": 20
      }
    }
  }
}
