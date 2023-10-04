/* eslint-disable no-console */
const mqtt = require('mqtt');

const options = {
  host: '68.178.168.62', //! 68.178.168.62
  port: 1883, //! 8083, 1883
  username: 'howin', //! howin
  password: 'howin', //! howin
};

// initialize the MQTT client
const client = mqtt.connect(options);

client.on('connect', () => {
  setInterval(() => {
    const random = Math.round(Math.random() * 50);
    console.log(random);
    // client.publish('testmaddog', random.toString());
    client.publish('testmaddog', 'TempCycle-3,10.56,34.67');
  }, 500);
});

client.on('error', (error) => {
  console.log(error);
});

client.subscribe('testmaddog');
// client.on('message', (topic, message) => {
//   console.log('Received message:', topic, message.toString());
// });
