/* eslint-disable no-console */
const randomLocation = require('random-location');

const P = {
  latitude: 19.034441585215543,
  longitude: 73.06403888922436,
};
const cycles = [];
for (let i = 1; i <= 100; i += 1) {
  const randomPoint = randomLocation.randomCirclePoint(P, 10000);
  const cycle = {};
  cycle.name = `TempCycle-${i}`;
  cycle.available = i % 3 !== 0;

  cycle.location = {
    type: 'Point',
    coordinates: [randomPoint.latitude, randomPoint.longitude],
  };
  cycles.push(cycle);
}

console.log(JSON.stringify(cycles));
