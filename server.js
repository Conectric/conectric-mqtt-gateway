const gateway = require('conectric-usb-gateway-beta')
const mqtt = require('mqtt')
const config = require('./config.json')

const sensorConfig = config.sensorMessages
const configOptions = {}

if (! sensorConfig.boot.enabled) {
  configOptions.sendBootMessages = false
}

if (sensorConfig.keepAlive.enabled) {
  configOptions.sendKeepAliveMessages = true
}

if (sensorConfig.tempHumidity.enabled && sensorConfig.tempHumidity.useFahrenheitTemps === false) {
  configOptions.useFahrenheitTemps = false
}

if (sensorConfig.switch.enabled && sensorConfig.switch.switchOpenValue === true) {
  configOptions.switchOpenValue = true
}

if (sensorConfig.motionStatus.enabled || sensorConfig.switchStatus.enabled) {
  configOptions.sendStatusMessages = true
}

const mqttConfig = config.mqtt
const mqttUrl = `${mqttConfig.protocol}://${mqttConfig.broker}`

console.log(`MQTT Broker: '${mqttUrl}'`)
console.log(`MQTT Client ID: '${mqttConfig.clientId}'`)
console.log('Additional config options:')
console.log(configOptions)

const mqttOpts = {}

if (mqttConfig.userName.length > 0) {
  mqttOpts.username = mqttConfig.userName
}

if (mqttConfig.password.length > 0) {
  mqttOpts.password = mqttConfig.password
}

mqttOpts.clientId = mqttConfig.clientId

const mqttClient = mqtt.connect(mqttUrl, mqttOpts)

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker.')
})

gateway.runGateway({
  ...configOptions,
  onSensorMessage: (sensorMessage) => {
    // Is this message type enabled?
    if (sensorConfig[sensorMessage.type].enabled) {
      const mqttTopic = sensorConfig[sensorMessage.type].mqttTopic

      console.log(sensorMessage)

      mqttClient.publish(mqttTopic, JSON.stringify(sensorMessage), (err) => {
        if (err) {
          console.log(`Error publishing message: ${err}`)
        }
      })
    }
  }
});