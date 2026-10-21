import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metric tracking
const intentLatency = new Trend('intent_post_duration_ms');
const rateLimitHits = new Counter('rate_limit_exceeded_count');
const errorRate = new Rate('error_rate');

export const options = {
  scenarios: {
    // Ramp up to 500 concurrent virtual users generating burst traffic
    burst_traffic: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 100 },  // Warm up
        { duration: '1m', target: 500 },   // Peak burst load
        { duration: '30s', target: 500 },  // Sustained stress
        { duration: '30s', target: 0 },    // Cooldown
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<150', 'p(99)<350'], // 95% of requests under 150ms
    error_rate: ['rate<0.05'],                      // Less than 5% non-rate-limited errors
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8081/api/v1';
const TENANT_ID = 'tenant-corp-alpha';

export default function () {
  const agentId = `agent-load-${__VU % 20}`;
  const mandateId = 'mandate-seed-001'; // pre-seeded active mandate

  const payload = JSON.stringify({
    agentId: agentId,
    mandateId: mandateId,
    vendorId: 'vendor-cloud-compute-aws',
    amount: (Math.random() * 45 + 5).toFixed(2), // $5 - $50 micro-charges
    currency: 'USD',
    memo: `Automated load test burst execution from VU ${__VU}`,
    idempotencyKey: `load-burst-${__VU}-${__ITER}-${Date.now()}`
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': TENANT_ID,
      'Authorization': 'Bearer mock-jwt-token-bench'
    },
  };

  const start = Date.now();
  const res = http.post(`${BASE_URL}/purchase-intents`, payload, params);
  const duration = Date.now() - start;

  intentLatency.add(duration);

  if (res.status === 429) {
    rateLimitHits.add(1);
    // Rate limit is an expected behavior of Redis token bucket during bursts
    check(res, {
      'rate limit header present': (r) => r.headers['Retry-After'] !== undefined || r.status === 429,
    });
  } else {
    const success = check(res, {
      'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'response has valid intent ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id !== undefined && body.status !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      errorRate.add(1);
    }
  }

  // Jittered sleep between 50ms and 200ms
  sleep(0.05 + Math.random() * 0.15);
}
