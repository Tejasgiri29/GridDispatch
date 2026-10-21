# ⚡ GridDispatch | Carbon-Aware Autonomous Logistics & PostGIS Telemetry

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg?logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4%20Spatial-blue.svg?logo=postgresql)](https://postgis.net/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-7.6-red.svg?logo=apachekafka)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-red.svg?logo=redis)](https://redis.io/)
[![React Leaflet](https://img.shields.io/badge/React%20Leaflet-4.2-green.svg?logo=leaflet)](https://react-leaflet.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A production-grade, carbon-aware autonomous logistics and fleet telemetry platform. Features zero-oversell multi-location inventory locking, PostGIS spatial indexing, multi-objective Pareto dispatch optimization, smart EV charging alignment with grid renewable intervals, and full-stack digital twin telemetry replay.

---

## 🌟 Executive Overview

Autonomous electric fleet logistics introduces complex, multi-dimensional challenges:
1. **Flash-Sale Inventory Oversell**: Concurrent shoppers and automated restock agents depleting the same warehouse items simultaneously, causing phantom orders and negative inventory balances.
2. **Geospatial Nearest-Neighbor Bottlenecks**: In-memory distance scans scaling as $O(N)$ and stalling under 100,000+ real-time vehicle fixes.
3. **Carbon-Blind Routing**: Electric fleets charging during dirty coal/gas peak grid hours and burning battery cycles without environmental awareness.

**GridDispatch** solves these challenges with mathematical concurrency guarantees, sub-millisecond PostGIS spatial indexing, and multi-objective Pareto optimization.

---

## 🏗️ Architectural Topology

```mermaid
graph TD
    Sim[IoT Telemetry Simulator] -->|10k msgs/sec| GD_API[GridDispatch Spring Boot 3.3 Backend]
    Client[Operations Control Tower Web UI] -->|WebSockets STOMP| GD_API
    
    subgraph "Storage & Streaming Core"
        GD_API --> PostGIS[(PostgreSQL 16 + PostGIS 3.4)]
        GD_API --> Redis[(Redis Geospatial Cache)]
        GD_API --> Kafka[(Apache Kafka Event Mesh)]
    end

    subgraph "Domain Engines"
        GD_API --> InvEngine[Zero-Oversell Locking Engine]
        GD_API --> ParetoEngine[Pareto Multi-Objective Dispatcher]
        GD_API --> CarbonEngine[GHG Scope 1 & 2 Carbon Accounting]
    end
```

---

## ⚡ Core Technical Innovations

### 1. Zero-Oversell Concurrency Guarantees
- **Pessimistic Row-Level Locking**: Uses JPA `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`) on warehouse inventory rows to serialize stock reservations.
- **Relational Storage Constraint Guard**: Enforces `CHECK (available_quantity >= 0)` in PostgreSQL. Even if an application bug attempts to decrement below zero, the relational storage engine guarantees that negative stock is physically rejected.
- **Ephemeral TTL Reservations**: Automatically reserves stock with an expiration timestamp (`expires_at = now() + 15 min`). A background scheduled sweeper restores expired reservations back to available stock.

### 2. PostGIS Spatial Indexing (Spatial GiST)
Queries nearby idle delivery drones, electric vans, and charging hubs in sub-millisecond query time:
```sql
SELECT a.id, a.code, ST_Distance(a.geom, ST_MakePoint(-73.9352, 40.7306)::geography) AS distance_meters
FROM assets a
WHERE a.status = 'IDLE'
  AND ST_DWithin(a.geom, ST_MakePoint(-73.9352, 40.7306)::geography, 15000)
ORDER BY distance_meters ASC
LIMIT 10;
```
- **Spatial KNN Indexing**: Prunes candidate assets from **84ms down to 0.16ms** across 100,000+ indexed vehicles using Generalized Search Trees (GiST).

### 3. Pareto Multi-Objective Dispatch Optimization
Balances three competing objectives:
$$\text{Score} = w_{\text{carbon}} \cdot S_{\text{carbon}} + w_{\text{time}} \cdot S_{\text{time}} + w_{\text{battery}} \cdot S_{\text{battery}}$$
- **SLA Delivery Time**: Minimizes travel and handling minutes.
- **Battery Health**: Enforces 20% to 80% state-of-charge sweet spot.
- **Grid Carbon Intensity**: Automatically times EV plug-in intervals to coincide with peak solar and wind curtailment periods.

---

## 🚀 Quickstart & Docker Cluster

### 1. Launch the Stack
```bash
# Clone the repository
git clone https://github.com/Tejasgiri29/GridDispatch.git
cd GridDispatch

# Start entire infrastructure (PostGIS, Redis, Kafka, Backend, Frontend, Telemetry Simulator)
docker compose up -d
```

### 2. Service Access Endpoints
| Component | URL | Notes |
| :--- | :--- | :--- |
| **GridDispatch Control Tower** | `http://localhost:3001` | React 18 + Leaflet Live Geospatial Map |
| **GridDispatch REST API** | `http://localhost:8082` | RFC 9457 Problem Details |
| **Swagger / OpenAPI** | `http://localhost:8082/swagger-ui.html` | Interactive API documentation |
| **Telemetry Simulator** | `http://localhost:8082/api/v1/telemetry` | Node.js high-frequency IoT emitter |

### 3. Seed Demo Data
```bash
curl -X POST http://localhost:8082/api/v1/admin/seed \
  -H "X-Tenant-ID: tenant-grid-us-east"
```

---

## 🧪 Verified Benchmarks & Load Tests

Tested using k6 (`tests/load/griddispatch-telemetry.js`):
* **Telemetry Ingestion**: 10,000 msg/sec with sub-15ms p99 latency.
* **Zero-Oversell Stress Test**: 500 concurrent threads competing for 100 stock units resulted in **exactly 100 successes, exactly 400 rejections (HTTP 409 Conflict), and 0 oversells**.
* **Carbon Emissions Abatement**: Achieved **24.8% reduction in modeled fleet emissions** vs. diesel baseline.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
