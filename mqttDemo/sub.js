/* eslint-disable no-console */
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  client.subscribe('test123');
  console.log('Client has subscribed');
});

client.on('message', (topic, message) => {
  console.log(message.toString());
});
