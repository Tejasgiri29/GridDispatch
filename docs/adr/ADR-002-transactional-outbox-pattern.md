# ADR-002: Transactional Outbox Pattern for Distributed Event Consistency

## Status
Accepted

## Context
When an order is dispatched or a payment is captured, the database state must be committed atomically with the emission of an event to Apache Kafka. The dual-write antipattern (writing to Postgres then publishing to Kafka in the same Java method) inevitably leads to data inconsistency:
- If Postgres commits but Kafka is down or times out, the event is lost.
- If Kafka publishes but Postgres rollback occurs due to a constraint violation, external consumers act on phantom data.
- Two-Phase Commit (2PC / XA) is slow, creates distributed deadlocks, and is not supported natively by Apache Kafka.

## Decision
We implement the **Transactional Outbox Pattern**:
1. Within the same local ACID database transaction as the business entity update, an `OutboxEvent` record is inserted into the `outbox_events` table in PostgreSQL.
2. A scheduled background worker (`OutboxPublisher` / `GridDispatchOutboxPublisher`) polls un-published events (`WHERE published = false ORDER BY created_at ASC LIMIT 50 FOR UPDATE SKIP LOCKED`).
3. The worker publishes the event to Apache Kafka and marks `published = true` and `published_at = now()`.
4. Kafka producers use idempotency (`enable.idempotence=true`) and `acks=all`.

## Consequences
### Positive
- Guarantees **at-least-once delivery** without distributed transactions.
- Zero risk of phantom event emission or event loss during network partitions.
- Independent database and broker lifecycles.

### Negative
- Consumers must implement idempotency (using deduplication records or database uniqueness constraints on event IDs).
- Introduces slight event publication lag (typically 20ms - 200ms depending on polling interval).
