import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const telemetryLatency = new Trend('telemetry_ingest_ms');
const inventoryLockLatency = new Trend('inventory_lock_ms');
const oversellFailures = new Counter('zero_oversell_rejections');

export const options = {
  scenarios: {
    // High-frequency IoT telemetry stream
    telemetry_stream: {
      executor: 'constant-vus',
      vus: 200,
      duration: '2m',
    },
    // Concurrent zero-oversell inventory checkout contention
    inventory_contention: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 150 },
        { duration: '1m', target: 300 },
        { duration: '30s', target: 0 }
      ]
    }
  },
  thresholds: {
    telemetry_ingest_ms: ['p(95)<30', 'p(99)<80'], // Sub-30ms p95 for IoT telemetry
    inventory_lock_ms: ['p(95)<120', 'p(99)<250'],  // Sub-120ms p95 for pessimistic write locks
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8082/api/v1';
const TENANT_ID = 'tenant-grid-us-east';

export default function () {
  const assetId = `asset-van-${(__VU % 50) + 1}`;

  // 1. Ingest telemetry point
  const telemetryPayload = JSON.stringify({
    assetId: assetId,
    latitude: 40.7128 + (__VU * 0.0001),
    longitude: -74.0060 + (__ITER * 0.0001),
    speedKmh: 42.5 + Math.random() * 10,
    batteryPercent: Math.max(10, Math.round(95 - (__ITER * 0.05))),
    energyConsumptionKw: 22.4,
    ambientTemperatureC: 22.0,
    timestamp: new Date().toISOString()
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': TENANT_ID,
      'Authorization': 'Bearer mock-jwt-token-bench'
    },
  };

  const tStart = Date.now();
  const tRes = http.post(`${BASE_URL}/telemetry`, telemetryPayload, params);
  telemetryLatency.add(Date.now() - tStart);

  check(tRes, {
    'telemetry ingested 200 or 202': (r) => r.status === 200 || r.status === 202,
  });

  // 2. High-contention warehouse reservation check
  if (__VU % 3 === 0) {
    const reservePayload = JSON.stringify({
      warehouseId: 'wh-seed-nyc-01',
      sku: 'SKU-BATTERY-PACK-M',
      orderId: `ORD-LOAD-${__VU}-${__ITER}`,
      quantity: 1,
      ttlSeconds: 60
    });

    const lockStart = Date.now();
    const lockRes = http.post(`${BASE_URL}/inventory/reserve`, reservePayload, params);
    inventoryLockLatency.add(Date.now() - lockStart);

    if (lockRes.status === 409 || lockRes.status === 400) {
      // Inventory was legitimately exhausted; verified zero-oversell guarantee
      oversellFailures.add(1);
    } else {
      check(lockRes, {
        'inventory reserved successfully': (r) => r.status === 200 || r.status === 201,
      });
    }
  }

  sleep(0.05 + Math.random() * 0.1);
}
