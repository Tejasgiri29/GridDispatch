# Apache Kafka & Event-Driven Systems Technical Interview Questions

Deep-dive Kafka questions derived from **future-java-platforms**.

---

## Question 1: How do you choose Kafka partition keys, and what happens when you experience partition hotspots?

### Model Answer
- **Partition Key Strategy**:
  - Kafka routes messages to partitions using a hash of the record key (`hash(key) % num_partitions`). Messages sharing the same key are guaranteed to land on the same partition and be consumed in strict chronological order.
  - In **AgentGuard**, we partition `agentguard.intents.v1` by `agentId` to guarantee that all purchase intents for a given agent are evaluated sequentially.
  - In **GridDispatch**, we partition `griddispatch.telemetry.v1` by `assetId` so that GPS trajectory points for a given delivery vehicle arrive in temporal order.
- **Partition Hotspots**:
  - If a single enterprise tenant or "super agent" generates 80% of total traffic, the partition handling that key becomes saturated while other consumer threads remain idle.
  - **Mitigations**:
    1. **Key Salting**: Append a bounded random suffix (e.g. `agent-123_#1`, `agent-123_#2`) to distribute load across partitions when strict total ordering across all sub-actions is not required.
    2. **Compound Keys**: Use composite keys like `tenantId + "_" + agentId` or `assetId + "_" + hourOfDay`.

---

## Question 2: What is the difference between At-Least-Once, At-Most-Once, and Exactly-Once Semantics in Kafka?

### Model Answer
1. **At-Most-Once**:
   - The consumer reads messages and commits its consumer offset *before* completing business processing. If the consumer crashes during processing, the message is skipped and lost.
2. **At-Least-Once** (Implemented in our projects):
   - The producer uses `acks=all` and retries upon transient errors. The consumer only commits offsets *after* successfully processing the event. If the consumer crashes midway, Kafka re-delivers the message upon partition rebalance.
   - Requires consumers to be idempotent (e.g. checking deduplication tables).
3. **Exactly-Once Semantics (EOS)**:
   - Uses the Kafka Transaction Coordinator (`enable.idempotence=true` on producers and `read_committed` on consumers) for atomic *consume-transform-produce* loops within Kafka-to-Kafka topologies.
   - However, when writing from Kafka to an external database (PostgreSQL), EOS requires application-level idempotency or two-phase commit, as Kafka transactions do not natively encompass relational database writes.
