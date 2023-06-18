/* eslint-disable no-console */
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  setInterval(() => {
    const random = Math.round(Math.random() * 50);
    console.log(random);
    client.publish('braham', random.toString());
  }, 1);
});
