# STRIDE Threat Model Analysis

This document provides a formal **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) threat model evaluation for **AgentGuard** and **GridDispatch**.

---

## 1. System Scope & Assets Under Protection

1. **Enterprise Financial Assets**: Corporate bank balances, merchant clearing accounts, credit facilities.
2. **Autonomous AI Agent Credentials**: Agent API tokens, spending mandates, vendor access permissions.
3. **Physical Fleet Assets & Battery Systems**: Autonomous delivery vans, cargo e-bikes, charging stations.
4. **Supply Chain Inventory**: High-value warehouse goods with zero-oversell guarantees.
5. **ESG Carbon Credits**: Verified carbon reduction compliance records and certificates.

---

## 2. STRIDE Matrix & Countermeasures

### 2.1 Spoofing (Identity Deception)
- **Threat**: An adversary spoofs an autonomous AI agent ID to dispatch unauthorized transactions or falsify telemetry coordinates.
- **Countermeasure**: Mutual TLS (mTLS) for simulator-to-gateway traffic; cryptographic JWT signatures validated on every request; IP allowlisting and VPC peering for backend services.

### 2.2 Tampering (Data Modification)
- **Threat**: Malicious actor alters historical journal entries to conceal embezzlement, or modifies inventory counts to siphon goods.
- **Countermeasure**: Relational foreign key `ON DELETE RESTRICT` constraints; database triggers revoking `UPDATE` and `DELETE` on financial tables; PostGIS geography checks ensuring coordinate points fall within valid planetary bounds.

### 2.3 Repudiation (Denial of Action)
- **Threat**: An agent or user claims they never initiated a costly procurement transaction or dispatch order.
- **Countermeasure**: Tamper-evident `audit_events` table recording user ID, IP address, timestamp, action name, and raw JSON snapshot of the state before and after transition.

### 2.4 Information Disclosure (Data Leakage)
- **Threat**: Cross-tenant data bleed where Tenant A views confidential shipment routes or financial balances belonging to Tenant B.
- **Countermeasure**: Mandatory `TenantFilter` enforcing `X-Tenant-ID` validation on all HTTP endpoints; composite primary/unique indexes prefixed by `tenant_id`; integration test suites verifying 404/403 responses across tenant boundary queries.

### 2.5 Denial of Service (System Availability)
- **Threat**: Distributed denial of service or LLM agent runaway loop flooding payment intent endpoints with 50,000 req/sec.
- **Countermeasure**: Atomic Redis token bucket rate limiting (HTTP 429 Too Many Requests); Spring Boot 3.3 Virtual Threads (preventing Tomcat thread pool exhaustion); Nginx edge connection throttling.

### 2.6 Elevation of Privilege (Unauthorized Access)
- **Threat**: A standard agent role triggers an emergency human approval override or modifies spending mandate maximums.
- **Countermeasure**: Spring Security `@PreAuthorize("hasRole('ROLE_COMPLIANCE_DIRECTOR')")` on approval and mandate modification endpoints.
