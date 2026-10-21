# SRE & Production Operations Runbook

This runbook provides deployment commands, operational health check procedures, alerting runbooks, and disaster recovery steps for **future-java-platforms**.

---

## 1. Quick Start Local Cluster Orchestration

The entire stack (backends, frontends, PostgreSQL, PostGIS, Redis, Kafka, Prometheus, Tempo, Grafana, simulator) spins up via Docker Compose:

```bash
# Clone and enter monorepo
cd future-java-platforms

# Start entire infrastructure and applications
make up
# OR
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### Port Mapping Reference
| Service | Internal Port | Host Port | Health Check URL |
| :--- | :--- | :--- | :--- |
| **AgentGuard Backend** | 8081 | 8081 | `http://localhost:8081/actuator/health` |
| **GridDispatch Backend**| 8082 | 8082 | `http://localhost:8082/actuator/health` |
| **AgentGuard Frontend**| 80 | 3000 | `http://localhost:3000` |
| **GridDispatch Frontend**| 80 | 3001 | `http://localhost:3001` |
| **PostgreSQL (Ledger)** | 5432 | 5432 | `pg_isready -h localhost -p 5432` |
| **PostgreSQL (PostGIS)**| 5432 | 5433 | `pg_isready -h localhost -p 5433` |
| **Redis** | 6379 | 6379 | `redis-cli ping` |
| **Apache Kafka** | 9092 | 9092 | `nc -z localhost 9092` |
| **Prometheus** | 9090 | 9090 | `http://localhost:9090/-/healthy` |
| **Grafana** | 3000 | 3005 | `http://localhost:3005/api/health` |

---

## 2. Kubernetes Deployment (Production)

Deploy to Amazon EKS / Google GKE:
```bash
# 1. Create namespace
kubectl apply -f infra/k8s/namespace.yaml

# 2. Deploy applications
kubectl apply -f infra/k8s/agentguard/deployment.yaml
kubectl apply -f infra/k8s/griddispatch/deployment.yaml

# 3. Apply ingress routing
kubectl apply -f infra/k8s/ingress.yaml
```

---

## 3. Production Alerting Thresholds (Prometheus)

Alert rules configured in `infra/observability/prometheus/prometheus.yml`:

```yaml
groups:
  - name: platforms-critical-alerts
    rules:
      - alert: DoubleEntryLedgerImbalance
        expr: agentguard_ledger_imbalance_total > 0
        for: 0m
        labels:
          severity: page
        annotations:
          summary: "CRITICAL: Double-entry ledger imbalance detected in AgentGuard"
          description: "Debit and Credit sums diverged. Immediate SRE & accounting freeze required."

      - alert: ZeroOversellInvariantBreached
        expr: griddispatch_inventory_negative_stock_total > 0
        for: 0m
        labels:
          severity: page
        annotations:
          summary: "CRITICAL: Negative inventory stock detected in GridDispatch"

      - alert: HighHttpErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.02
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "HTTP 5xx rate exceeded 2% over 5 minutes"
```
