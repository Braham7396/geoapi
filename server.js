/* eslint-disable no-promise-executor-return */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const mqtt = require('mqtt');
const Cycle = require('./models/cycleModel');

//new shit
//
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION! SHUTTING DOWN...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

function mqttConnectWithCycleDB() {
  const options = {
    host: process.env.MQTT_HOST,
    port: process.env.MQTT_PORT,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  };

  const client = mqtt.connect(options);

  client.on('connect', () => {
    client.subscribe('testmaddog');
    console.log('MQTT client has subscribed');
  });
  let flag = false;
  client.on('message', async (topic, message) => {
    message = message.toString().split(',');
    message[1] = +message[1];
    message[2] = +message[2];
    if (flag === true) return;
    flag = true;
    const updateLocation = {
      $set: {
        'location.coordinates': [message[1], message[2]],
      },
    };

    await Cycle.updateOne({ name: message[0] }, updateLocation);
    console.log(`${message[0]}`);
  });

  setInterval(() => {
    flag = false; // Reset the flag to false
  }, process.env.MQTT_UPDATE_INTERVAL);
}

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful!');
    mqttConnectWithCycleDB();
  });

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! SHUTTING DOWN...');
  server.close(() => {
    process.exit(1);
  });
});
