# REST API Specification & RFC 9457 Contracts

Both applications expose standardized REST APIs compliant with **IETF RFC 9457 (Problem Details for HTTP APIs)** and **OpenAPI 3.1** specification.

---

## 1. Global Headers & Multi-Tenancy

Every incoming HTTP request must supply:
- `X-Tenant-ID`: The unique enterprise tenant identifier (e.g. `tenant-corp-alpha`, `tenant-grid-us-east`).
- `Authorization`: `Bearer <jwt_token>` (optional for demo / seed endpoints).
- `Idempotency-Key`: UUID string supplied for non-idempotent operations (`POST /purchase-intents`, `POST /inventory/reserve`).

---

## 2. AgentGuard API Reference (Port 8081)

### 2.1 Purchase Intents & Approval
- `POST /api/v1/purchase-intents`
  - Evaluates spending mandate bounds and runs heuristic risk scoring.
  - Request:
    ```json
    {
      "agentId": "agent-procure-001",
      "mandateId": "mandate-seed-001",
      "vendorId": "vendor-aws-cloud",
      "amount": 149.99,
      "currency": "USD",
      "memo": "Auto-scaled cluster compute",
      "idempotencyKey": "a9e6d0a1-4321-4f1e-9273-d8cf81234567"
    }
    ```
  - Response (201 Created):
    ```json
    {
      "id": "intent-uuid-1",
      "status": "APPROVED",
      "riskScore": 12.5,
      "requiresApproval": false,
      "orderId": "ord-uuid-1"
    }
    ```

- `POST /api/v1/approvals/{id}/decision`
  - Human-in-the-loop approval or rejection for flagged intents.
  - Request:
    ```json
    {
      "decision": "APPROVED",
      "reviewerId": "user-director-compliance",
      "reason": "Verified legitimate LLM infrastructure burst"
    }
    ```

### 2.2 Double-Entry General Ledger
- `GET /api/v1/ledger/accounts`
  - Returns tenant chart of accounts with real-time balances.
- `GET /api/v1/ledger/trial-balance`
  - Verifies $\sum Debits \equiv \sum Credits$.
  - Response:
    ```json
    {
      "totalDebits": 145000.00,
      "totalCredits": 145000.00,
      "isBalanced": true
    }
    ```
- `POST /api/v1/ledger/journal-entries`
  - Posts a manual balanced journal entry. Throws 400 if $\sum Debits \ne \sum Credits$.

---

## 3. GridDispatch API Reference (Port 8082)

### 3.1 Zero-Oversell Inventory
- `POST /api/v1/inventory/reserve`
  - Locks stock with `PESSIMISTIC_WRITE` and creates an auto-releasing TTL hold.
  - Request:
    ```json
    {
      "warehouseId": "wh-seed-nyc-01",
      "sku": "SKU-BATTERY-PACK-M",
      "orderId": "ORD-98412",
      "quantity": 2,
      "ttlSeconds": 900
    }
    ```
  - Response (201 Created):
    ```json
    {
      "reservationId": "res-uuid-1",
      "status": "PENDING",
      "expiresAt": "2026-10-21T00:15:00Z"
    }
    ```

### 3.2 Telemetry Ingestion & Fleet
- `POST /api/v1/telemetry`
  - Ingests high-frequency IoT coordinates, battery status, and inverter draw.
  - Request:
    ```json
    {
      "assetId": "asset-van-01",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "speedKmh": 45.2,
      "batteryPercent": 84,
      "energyConsumptionKw": 18.2,
      "ambientTemperatureC": 21.0,
      "timestamp": "2026-10-21T00:00:00Z"
    }
    ```

### 3.3 Multi-Objective Pareto Dispatch
- `POST /api/v1/dispatch/orders/{orderId}`
  - Evaluates eligible idle vehicles and assigns optimal asset.
  - Response (200 OK):
    ```json
    {
      "assignmentId": "asgn-uuid-1",
      "orderId": "ord-uuid-1",
      "assetId": "asset-van-02",
      "efficiencyScore": 92.4,
      "co2SavingsGrams": 4250.0
    }
    ```
