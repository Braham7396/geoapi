/* eslint-disable no-console */
const mqtt = require('mqtt');

const options = {
  host: '099aa08ec5f04abfb59e89a4cfd21bab.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'braham',
  password: 'Anu739625@',
};

// initialize the MQTT client
const client = mqtt.connect(options);

client.on('connect', () => {
  setInterval(() => {
    const random = Math.round(Math.random() * 50);
    console.log(random);
    client.publish('testmaddog', random.toString());
  }, 5);
});

client.on('error', (error) => {
  console.log(error);
});

client.subscribe('testmaddog');
client.on('message', (topic, message) => {
  console.log('Received message:', topic, message.toString());
});
