# ADR-005: Redis Atomic Token Bucket Rate Limiting

## Status
Accepted

## Context
Autonomous AI agents can loop unexpectedly, hallucinate runaway API calls, or execute high-frequency bursts that overload downstream payment processors and cloud compute. Traditional rate limiting (e.g. JVM memory counters) fails in clustered deployments because state is not shared across horizontal pod instances. Fixed-window counters in Redis allow double the threshold limit at boundary transitions.

## Decision
We implement a distributed **Token Bucket Rate Limiter** executed via an atomic Lua script in Redis:
1. Every purchase intent or API request identifies the tenant, agent, and route key (`ratelimit:{tenant}:{agent}:{action}`).
2. An atomic Redis Lua script checks current token capacity and increments in a single network round-trip.
3. If the request exceeds the allowed velocity (e.g. 10 req/min for purchase intents, 100 req/sec for telemetry), the request is rejected immediately with HTTP 429 (`ProblemDetails: RateLimitExceededException`) and a `Retry-After` header.
4. If Redis is temporarily unreachable, the service falls back gracefully to a degraded platform-level local Guava limiter rather than failing open.

## Consequences
### Positive
- Sub-millisecond latency (< 1.2ms p99) evaluated before touching the PostgreSQL database.
- Completely consistent across horizontal Kubernetes replicas.
- Protects downstream payment gateways from chargeback rate penalties.

### Negative
- Requires Redis cluster high-availability (Sentinel or Redis Cluster) in production.
