# Distributed Event Topology & Kafka Integration

Both platforms implement an asynchronous, event-driven architecture using **Apache Kafka** orchestrated via the **Transactional Outbox Pattern** to ensure zero dual-write data loss.

---

## 1. Kafka Topics & Schemas

### 1.1 AgentGuard Topics
| Topic Name | Partition Key | Retention | Description |
| :--- | :--- | :--- | :--- |
| `agentguard.intents.v1` | `agentId` | 7 days | Dispatched purchase intents from AI agents |
| `agentguard.orders.v1` | `orderId` | 30 days | Order lifecycle state transitions (COMPLETED, FAILED) |
| `agentguard.ledger.v1` | `tenantId` | Permanent | Immutable journal entry postings for downstream reporting |
| `agentguard.audit.v1` | `tenantId` | Permanent | SOC2 / ISO-27001 tamper-evident audit events |

### 1.2 GridDispatch Topics
| Topic Name | Partition Key | Retention | Description |
| :--- | :--- | :--- | :--- |
| `griddispatch.telemetry.v1` | `assetId` | 3 days | High-frequency IoT telemetry coordinates & speed |
| `griddispatch.dispatches.v1`| `orderId` | 14 days | Multi-objective dispatch assignments |
| `griddispatch.anomalies.v1` | `assetId` | 30 days | Detected safety anomalies (battery drop, geofence exit) |
| `griddispatch.emissions.v1` | `tenantId` | Permanent | Periodic verified carbon abatement reports |

---

## 2. Event Payload Schema Example (JSON Schema)

### `agentguard.orders.v1`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "enum": ["ORDER_COMPLETED", "ORDER_FAILED", "REFUND_PROCESSED"] },
    "tenantId": { "type": "string" },
    "aggregateId": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "payload": {
      "type": "object",
      "properties": {
        "orderId": { "type": "string" },
        "intentId": { "type": "string" },
        "amount": { "type": "number" },
        "currency": { "type": "string" },
        "journalEntryId": { "type": "string" }
      },
      "required": ["orderId", "amount", "currency"]
    }
  },
  "required": ["eventId", "eventType", "tenantId", "timestamp", "payload"]
}
```

---

## 3. Consumer Idempotency Pattern

To handle inevitable network retries and deliver **exactly-once processing semantics** at the application level:
```java
@KafkaListener(topics = "agentguard.orders.v1", groupId = "agentguard-order-processor")
@Transactional
public void consumeOrderEvent(ConsumerRecord<String, String> record) {
    String eventId = record.key();
    
    // 1. Check idempotency table
    if (idempotencyRepository.existsById(eventId)) {
        log.info("Duplicate event {} ignored", eventId);
        return;
    }
    
    // 2. Process business logic
    processEvent(record.value());
    
    // 3. Mark processed atomically in same transaction
    idempotencyRepository.save(new IdempotencyRecord(eventId, Instant.now()));
}
```
