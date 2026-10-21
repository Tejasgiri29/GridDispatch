import axios from 'axios';

interface SimAsset {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  battery: number;
  temp: number;
  state: 'DRIVING' | 'IDLE' | 'CHARGING';
  latDelta: number;
  lonDelta: number;
}

const targetUrl = process.env.SIMULATOR_TARGET_URL || 'http://localhost:8082/api/v1/telemetry/batch';
const intervalMs = parseInt(process.env.SIMULATOR_INTERVAL_MS || '2000', 10);
const tenantId = process.env.SIMULATOR_TENANT_ID || 'tenant-logistics-us';

const fleet: SimAsset[] = [
  {
    id: 'asset-ev-van-101',
    name: 'EcoTransit EV Van #101',
    type: 'EV_VAN',
    lat: 37.7760,
    lon: -122.4180,
    speed: 38.0,
    heading: 90.0,
    battery: 84.5,
    temp: 52.0,
    state: 'DRIVING',
    latDelta: 0.0003,
    lonDelta: 0.0004
  },
  {
    id: 'asset-bike-201',
    name: 'GreenSpeed E-Cargo Bike #201',
    type: 'CARGO_BIKE',
    lat: 37.7650,
    lon: -122.4100,
    speed: 18.0,
    heading: 45.0,
    battery: 68.0,
    temp: 36.0,
    state: 'DRIVING',
    latDelta: 0.00015,
    lonDelta: 0.0002
  },
  {
    id: 'asset-robot-301',
    name: 'Sidewalk Scout Bot #301',
    type: 'ROBOT',
    lat: 37.7745,
    lon: -122.3995,
    speed: 5.2,
    heading: 180.0,
    battery: 76.0,
    temp: 32.0,
    state: 'DRIVING',
    latDelta: -0.00008,
    lonDelta: 0.00005
  },
  {
    id: 'asset-drone-401',
    name: 'SkyCourier Drone Alpha #401',
    type: 'DRONE',
    lat: 37.4419,
    lon: -122.1430,
    speed: 55.0,
    heading: 270.0,
    battery: 98.0,
    temp: 41.0,
    state: 'DRIVING',
    latDelta: 0.0005,
    lonDelta: -0.0006
  },
  {
    id: 'asset-ev-van-102',
    name: 'EcoTransit EV Van #102',
    type: 'EV_VAN',
    lat: 37.7800,
    lon: -122.4050,
    speed: 0.0,
    heading: 0.0,
    battery: 92.0,
    temp: 24.0,
    state: 'IDLE',
    latDelta: 0,
    lonDelta: 0
  }
];

let tickCounter = 0;

async function sendTelemetryBatch() {
  tickCounter++;

  const events = fleet.map(asset => {
    // Update vehicle movement
    if (asset.state === 'DRIVING') {
      asset.lat += asset.latDelta + (Math.random() - 0.5) * 0.00005;
      asset.lon += asset.lonDelta + (Math.random() - 0.5) * 0.00005;

      // Realistic battery drain
      asset.battery = Math.max(10.0, asset.battery - 0.05);

      // Bounce perimeter if moving too far from Bay Area center
      if (asset.lat > 37.8100 || asset.lat < 37.7200) asset.latDelta *= -1;
      if (asset.lon > -122.3700 || asset.lon < -122.4600) asset.lonDelta *= -1;
    } else if (asset.state === 'CHARGING') {
      asset.battery = Math.min(100.0, asset.battery + 0.3);
    }

    return {
      assetId: asset.id,
      latitude: parseFloat(asset.lat.toFixed(6)),
      longitude: parseFloat(asset.lon.toFixed(6)),
      speedKmh: parseFloat(asset.speed.toFixed(1)),
      headingDegrees: asset.heading,
      batteryPercent: parseFloat(asset.battery.toFixed(2)),
      motorTemperatureC: parseFloat(asset.temp.toFixed(1)),
      geofenceStatus: 'INSIDE'
    };
  });

  try {
    const res = await axios.post(targetUrl, { events }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId
      },
      timeout: 3000
    });
    if (tickCounter % 10 === 0) {
      console.log(`[Simulator Tick #${tickCounter}] Telemetry batch delivered: ${events.length} assets.`);
    }
  } catch (err: any) {
    console.warn(`[Simulator Warning] Batch transmission deferred: ${err.message}`);
  }
}

console.log(`=======================================================`);
console.log(` Autonomous Telemetry Simulator Running`);
console.log(` Target: ${targetUrl} | Interval: ${intervalMs}ms`);
console.log(`=======================================================`);

setInterval(sendTelemetryBatch, intervalMs);
sendTelemetryBatch();
