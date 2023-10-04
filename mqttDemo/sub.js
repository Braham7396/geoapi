/* eslint-disable no-console */
const mqtt = require('mqtt');

const options = {
  host: '68.178.168.62',
  port: 1883,
  username: 'howin',
  password: 'howin',
};

const client = mqtt.connect(options);

client.on('connect', () => {
  client.subscribe('testmaddog');
  console.log('Client has subscribed');
});

client.on('message', (topic, message) => {
  message = message.toString().split(',');
  console.log(message);
});
