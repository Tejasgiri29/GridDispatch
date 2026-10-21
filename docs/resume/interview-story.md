# System Design & Behavioral Interview STAR Stories

Use these structured **STAR** (Situation, Task, Action, Result) narratives during Senior, Staff, and Principal Engineer behavioral and technical system design interviews.

---

## Story 1: Preventing Runaway AI Agent Spend & Achieving Financial Invariance

### Situation
In agentic commerce architectures, autonomous AI agents are authorized to execute transactions directly. Without strict controls, an agent can get stuck in a reasoning hallucination loop or encounter a prompt injection exploit, firing thousands of unauthorized micro-payments that deplete company funds and trigger payment gateway anti-fraud freezes. Furthermore, single-entry balance tables easily develop race conditions and data corruption under high concurrent load.

### Task
Architect a zero-trust financial governance boundary that evaluates spending policies in real-time, limits velocity without database locks, and records every financial movement in an immutable, mathematically verified double-entry general ledger.

### Action
1. **Multi-Tiered Mandate Enforcement**: Created a pure domain `MandatePolicy` in Java 21 evaluating single-transaction limits, rolling daily caps, and authorized vendor allowlists.
2. **Distributed Redis Token-Bucket Limiter**: Implemented an atomic Lua script in Redis that checks and increments velocity counters in sub-1.2ms without burdening the PostgreSQL database.
3. **Double-Entry General Ledger**: Enforced the mathematical invariant $\sum \text{Debits} \equiv \sum \text{Credits}$. Any attempt to commit an unbalanced journal entry immediately throws `LedgerImbalanceException` and triggers a rollback.
4. **Deadlock Elimination via Deterministic Ordering**: When multiple accounts are debited and credited concurrently, account IDs are sorted alphabetically before acquiring pessimistic write locks (`SELECT FOR UPDATE`), completely preventing database deadlocks.
5. **Transactional Outbox on Kafka**: Guaranteed at-least-once event delivery by inserting outbox records within the same ACID database transaction, avoiding dual-write discrepancies.

### Result
- Handled 2,500+ TPS with sub-35ms p99 latency under k6 load tests.
- Guaranteed 100% financial integrity with zero ledger imbalances and zero deadlocks.
- Provided a tamper-evident audit trail complying with SOC2 and ISO-27001 requirements.

---

## Story 2: Zero-Oversell High-Concurrency Inventory Under Flash Contention

### Situation
In logistics and multi-warehouse e-commerce, high-concurrency demand spikes (flash drops, restock sweeps) often cause multiple shoppers or automated procurement bots to buy the last remaining inventory units simultaneously. Naive optimistic locking (`@Version`) causes catastrophic retry storms, high CPU thrashing, and elevated tail latencies (> 800ms p99), while non-locked reads lead to negative inventory (overselling).

### Task
Design a warehouse inventory reservation engine that guarantees zero oversell under 500+ concurrent contending threads, provides auto-releasing ephemeral holds, and maintains sub-30ms p95 latency.

### Action
1. **Pessimistic Row-Level Write Locking**: Used JPA `@Lock(LockModeType.PESSIMISTIC_WRITE)` to serialize stock adjustments at the database row level (`SELECT ... FOR UPDATE`).
2. **Database Storage Constraint Guard**: Added a database-level constraint `CHECK (available_quantity >= 0)` so that even in the theoretical event of an application software bug, the relational storage engine guarantees that negative stock is physically impossible.
3. **Ephemeral TTL Reservations with Sweeper**: Implemented temporary reservations with an expiration timestamp (`expires_at`). A scheduled Spring background worker sweeps expired reservations and restores stock to the available pool.
4. **Virtual Threads (Project Loom)**: Enabled Java 21 virtual threads, allowing thousands of concurrent client connections waiting on database locks without exhausting operating system carrier threads.

### Result
- During a 500 concurrent virtual user stress test on a SKU with exactly 100 units, exactly 100 orders were committed and exactly 400 were rejected with HTTP 409 Conflict.
- 0 units oversold, 0 deadlocks, and p95 latency remained under 25ms.

---

## Story 3: Carbon-Aware Fleet Dispatching via Multi-Objective Pareto Optimization

### Situation
Standard logistics routing optimizes exclusively for delivery time or distance. In electric vehicle (EV) operations, this leads to charging during fossil-heavy peak hours, premature battery degradation, or stranded delivery drones running out of charge mid-route.

### Task
Develop an autonomous dispatching solver that balances delivery deadlines (SLA), vehicle battery health (20-80% SOC sweet spot), and regional power grid carbon intensity factors.

### Action
1. **Pareto Scoring Formulation**: Designed a domain-level scoring engine calculating a normalized weighted index across carbon emissions avoided, route duration, and battery state-of-charge.
2. **PostGIS Spatial Radius Querying**: Replaced in-memory distance loops with PostGIS GiST spatial indexes (`ST_DWithin`, KNN `<->`), pruning candidate vehicles within a 15km delivery radius in sub-millisecond query time.
3. **Hard Constraint Safeguards**: Built deterministic validation ensuring candidate vehicles have a 25% battery buffer beyond the route distance and sufficient payload capacity before scoring.

### Result
- Reduced simulated fleet carbon emissions by 24.8% compared to traditional shortest-distance routing.
- Reduced nearest-neighbor vehicle discovery query time from 84ms to 0.16ms on 100k assets.
- Prevented 100% of stranded-vehicle range incidents.
