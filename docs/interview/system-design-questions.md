# System Design Interview Questions & Model Answers

These high-level system design questions are directly derived from the architecture of **AgentGuard** and **GridDispatch**.

---

## Question 1: How do you design an immutable double-entry ledger that guarantees mathematical consistency under high concurrent load?

### Model Answer
1. **Core Data Model**:
   - Separate the ledger into `LedgerAccount`, `JournalEntry`, and `JournalLine`.
   - A `JournalEntry` contains an immutable set of `JournalLine` items. Each line is either a `DEBIT` or `CREDIT`.
   - Enforce the accounting invariant: $\sum \text{Debits} \equiv \sum \text{Credits}$.
2. **Concurrency & Deadlock Prevention**:
   - Single-entry balance tables risk race conditions. To maintain accurate denormalized account balances without deadlocks, sort all involved account IDs in ascending order before acquiring pessimistic write locks (`SELECT ... FOR UPDATE`).
   - Acquire locks in strict sorted order, mutate the balances, insert the immutable journal lines, and commit the transaction.
3. **Immutability & Audit**:
   - Revoke `UPDATE` and `DELETE` database privileges on journal tables.
   - Any financial adjustment or refund is handled by posting an explicit **Reversal Journal Entry** with equal and opposite entries.
4. **Reconciliation**:
   - Implement an automated trial balance check that sums debits and credits across the chart of accounts, verifying zero variance continuously.

---

## Question 2: How do you eliminate the dual-write problem when updating a database and publishing an event to Kafka?

### Model Answer
1. **The Anti-Pattern**:
   - Writing to PostgreSQL and calling `kafkaTemplate.send()` inside the same Java `@Transactional` method is an anti-pattern. If the database commits but Kafka is temporarily unreachable, the event is permanently lost. If Kafka publishes but the database transaction rolls back, external consumers process phantom data.
2. **The Transactional Outbox Pattern**:
   - In the same local ACID transaction as the business entity, insert an `OutboxEvent` record into an `outbox_events` table in PostgreSQL.
   - A separate background publisher (or Debezium CDC reading the PostgreSQL WAL log) polls unpublished events with `FOR UPDATE SKIP LOCKED`.
   - The publisher emits the event to Kafka and marks the record as published upon broker acknowledgment (`acks=all`).
3. **Consumer Idempotency**:
   - Because outbox publishers can retry upon transient network errors, consumers must be idempotent by checking a deduplication table before executing side-effects.

---

## Question 3: How do you design a zero-oversell inventory system under flash-sale concurrency?

### Model Answer
1. **Pessimistic Locking vs. Optimistic Locking**:
   - Under low contention, optimistic locking (`@Version`) works well. Under extreme contention (e.g. 500 shoppers trying to buy the last 5 items), optimistic locking causes excessive retry storms and elevated tail latency.
   - Use pessimistic row-level write locking (`SELECT FOR UPDATE`) on the specific inventory item row.
2. **Database Storage Defense**:
   - Add a SQL check constraint: `CHECK (available_quantity >= 0)`. Even if an application bug attempts to decrement below zero, the database engine aborts the transaction.
3. **Two-Phase Reservation with TTL**:
   - Avoid deducting inventory permanently during checkout initiation. Instead, move stock from `available_quantity` to `reserved_quantity` and record an `InventoryReservation` with an expiration timestamp (`expires_at = now() + 15 minutes`).
   - A scheduled background sweeper continuously finds expired uncommitted reservations and restores the stock to the available pool.
