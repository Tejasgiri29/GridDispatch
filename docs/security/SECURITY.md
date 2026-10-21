# Security Architecture & Compliance Guidelines

Security in AgentGuard and GridDispatch is architected under the principle of **Zero Trust**, enforcing multi-tenant isolation, cryptographic auditability, rate-limited denial of service resistance, and fine-grained role-based access control.

---

## 1. Authentication & Authorization Perimeter

### 1.1 Stateless JWT Authentication
- All external API traffic requires Bearer token authentication validated via Spring Security filter chains.
- Tokens are signed with RS256 (asymmetric RSA 2048-bit keypair) or HMAC-SHA256 in development.
- Tokens carry tenant claims (`tenant_id`), actor identities (`sub`), and authorization roles (`ROLE_AGENT`, `ROLE_OPERATOR`, `ROLE_COMPLIANCE_DIRECTOR`).

### 1.2 Multi-Tenant Context Isolation
- Inbound requests have their `X-Tenant-ID` header validated against the authenticated user's authorized tenant list.
- A servlet filter (`TenantFilter`) stores the tenant context in a scoped `ThreadLocal`.
- Clean teardown in `finally` blocks prevents virtual thread reuse data leakage across tenants.

---

## 2. Cryptographic Integrity & Tamper-Evident Audit Trails

### 2.1 Immutable Append-Only Audit Log
- All state changes (mandate creation, human approval decisions, journal entry postings, asset status updates) generate an `AuditEvent`.
- The database enforces append-only semantics: `DELETE` and `UPDATE` permissions on the `audit_events` and `journal_lines` tables are strictly revoked from application database roles.
- Changes can only be offset via compensatory records (e.g. reversal journal entries).

---

## 3. Defense Against Autonomous AI Agent Exploits

| Attack Vector | Vulnerability Description | Mitigation Implemented |
| :--- | :--- | :--- |
| **Runaway LLM Hallucination** | Agent enters infinite loop dispatching payments | Redis token bucket rate limiting (max 10 req/min) |
| **Privilege Escalation** | Agent attempts spending beyond approved bounds | Strict domain `MandatePolicy` checks against daily & single-tx limits |
| **Prompt Injection Fraud** | Unverified third-party prompts manipulate agent memo | Heuristic Risk Engine with `PROMPT_INJECTION_RISK` rule flagging |
| **Double-Spend Replay** | Replaying identical payment requests over HTTP | Mandatory `Idempotency-Key` headers stored in Redis/DB |
| **SQL Injection** | Dynamic SQL in query parameters | 100% Parameterized JPA / Hibernate queries with zero concatenation |
