# System Architecture & Technical Specifications

This document outlines the distributed systems architecture, component interactions, saga orchestration flows, and hexagonal boundaries for **AgentGuard** and **GridDispatch**.

---

## 1. High-Level Monorepo Topology

```mermaid
graph TD
    Client[Web Browsers & Autonomous AI Agents] --> Ingress[Nginx Ingress Controller]
    
    subgraph "AgentGuard Platform"
        Ingress -->|/api/v1/agentguard| AG_API[AgentGuard Backend - Spring Boot 3.3 / Java 21]
        AG_API --> AG_PG[(PostgreSQL - Financial Ledger)]
        AG_API --> AG_Redis[(Redis - Token Bucket & Locks)]
        AG_API --> Kafka[(Apache Kafka Event Mesh)]
    end

    subgraph "GridDispatch Platform"
        Ingress -->|/api/v1/griddispatch| GD_API[GridDispatch Backend - Spring Boot 3.3 / Java 21]
        GD_API --> GD_PG[(PostgreSQL + PostGIS - Fleet & Geospatial)]
        GD_API --> GD_Redis[(Redis - Telemetry Stream)]
        GD_API --> Kafka
        Sim[IoT Telemetry Simulator - Node.js] -->|Ingest Stream| GD_API
    end

    subgraph "Observability & SRE"
        AG_API -.->|Traces & Metrics| OTel[OpenTelemetry Collector]
        GD_API -.->|Traces & Metrics| OTel
        OTel --> Prometheus[(Prometheus)]
        OTel --> Tempo[(Grafana Tempo)]
        Prometheus --> Grafana[Grafana Dashboards]
        Tempo --> Grafana
    end
```

---

## 2. AgentGuard: Hexagonal Architecture & Saga Flow

### 2.1 Hexagonal Layering
AgentGuard separates domain business rules from external technology concerns:
- **Domain Core**: Pure Java entities (`Mandate`, `PurchaseIntent`, `RiskDecision`, `LedgerAccount`, `JournalEntry`). Contains no dependencies on Spring or JPA.
- **Inbound Adapters**: Spring REST Controllers (`PurchaseIntentController`, `LedgerController`) exposing RFC 9457 APIs.
- **Outbound Ports**: `PaymentGatewayPort`, `FraudScorePort`, `NotificationPort`.
- **Outbound Adapters**: `MockPaymentGatewayAdapter`, `OutboxPublisher`, `KafkaProducer`.

### 2.2 Autonomous Order Saga Orchestration
When an AI agent executes a high-value purchase:
```mermaid
sequenceDiagram
    autonumber
    actor Agent as Autonomous AI Agent
    participant API as PurchaseIntentController
    participant Policy as Mandate & Risk Engine
    participant Saga as OrderSagaOrchestrator
    participant PG as PaymentGatewayPort
    participant Ledger as LedgerService (Double-Entry)
    participant Outbox as Transactional Outbox
    participant Kafka as Apache Kafka

    Agent->>API: POST /purchase-intents (idempotency-key, mandateId, amount)
    API->>Policy: Evaluate Mandate Bounds & Heuristic Risk Rules
    alt Exceeds Human Approval Threshold
        Policy-->>API: Requires Human-in-the-Loop Approval (HOLD)
        API-->>Agent: HTTP 202 Accepted (Status: PENDING_APPROVAL)
    else Approved
        Policy-->>API: Status: APPROVED
        API->>Saga: executeOrderSaga(intent)
        Saga->>PG: Authorize & Capture Charge
        alt Gateway Success
            Saga->>Ledger: Post Balanced Journal Entry (Debit: A/R, Credit: Revenue)
            Note over Ledger: ∑ Debits ≡ ∑ Credits Verified
            Saga->>Outbox: Save OutboxEvent (ORDER_COMPLETED)
            Saga-->>API: Order Successful
            API-->>Agent: HTTP 201 Created (Status: COMPLETED)
        else Gateway Decline
            Saga->>Saga: Trigger Compensating Transaction
            Saga->>Outbox: Save OutboxEvent (ORDER_FAILED)
            API-->>Agent: HTTP 402 Payment Required
        end
    end
    Outbox->>Kafka: Background Outbox Publisher emits to 'agentguard.orders.v1'
```

---

## 3. GridDispatch: Geospatial Routing & Zero-Oversell Flow

### 3.1 Zero-Oversell Concurrency Control
```mermaid
sequenceDiagram
    autonumber
    actor Shopper as Customer / E-Commerce Agent
    participant InvAPI as InventoryController
    participant InvService as InventoryService
    participant DB as PostgreSQL (Inventory Table)
    participant Sweeper as Scheduled TTL Sweeper

    Shopper->>InvAPI: POST /inventory/reserve (warehouseId, sku, quantity, ttl=900s)
    InvAPI->>InvService: reserveInventory()
    InvService->>DB: SELECT * FROM inventory_items WHERE warehouse_id=? AND sku=? FOR UPDATE
    Note over DB: Pessimistic Write Lock Acquired
    alt Available Qty >= Requested Qty
        InvService->>DB: UPDATE inventory_items SET available = available - qty, reserved = reserved + qty
        InvService->>DB: INSERT INTO inventory_reservations (orderId, sku, expires_at)
        DB-->>InvService: Commit Transaction (Lock Released)
        InvService-->>Shopper: HTTP 201 Created (Reservation Confirmed)
    else Insufficient Available Qty
        DB-->>InvService: Rollback Transaction (Lock Released)
        InvService-->>Shopper: HTTP 409 Conflict (Zero-Oversell Guarantee Enforced)
    end

    Note over Sweeper: Every 60 seconds
    Sweeper->>DB: SELECT * FROM inventory_reservations WHERE status='PENDING' AND expires_at < NOW()
    Sweeper->>DB: Release Expired Reserved Quantity back to Available Pool
```

### 3.2 Pareto Multi-Objective Dispatch Optimization
The dispatch solver balances four competing objective functions:
1. $f_1(x) = \text{Route Duration (minutes)}$
2. $f_2(x) = \text{Carbon Footprint (grams } CO_2e)$
3. $f_3(x) = \text{Battery Wear Cost}$
4. $f_4(x) = \text{Vehicle Capacity Utilization}$

```text
Score(v, o) = w_carbon * (1 - CO2_est / Baseline_CO2) 
            + w_time * (1 - Duration / SLA_max) 
            + w_battery * (SOC_current / 100)
```
Hard constraints:
- $\text{Vehicle Payload} + \text{Order Weight} \le \text{MaxPayloadKg}$
- $\text{Remaining Range} \ge 1.25 \times \text{Route Distance}$
- $\text{Vehicle Status} == \text{IDLE}$
