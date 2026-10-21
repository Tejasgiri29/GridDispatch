# ADR-009: Discriminator-Based Multi-Tenancy Architecture

## Status
Accepted

## Context
AgentGuard and GridDispatch are SaaS platforms serving enterprise clients across North America and Europe. We evaluated three architectural patterns for multi-tenancy:
1. **Database-per-tenant**: Separate physical database per tenant. High isolation, but high infrastructure cost and complex cross-tenant migrations.
2. **Schema-per-tenant**: Single database, separate PostgreSQL schemas. Moderate isolation, but connection pool exhaustion and Flyway migration overhead across hundreds of schemas.
3. **Discriminator column (shared schema)**: Single schema with `tenant_id` column on all tenant-scoped tables, enforced via servlet filters and repository queries.

## Decision
We implement **Discriminator-Based Multi-Tenancy** backed by a servlet filter and `TenantContext`:
1. Every HTTP request requires an `X-Tenant-ID` header (or JWT claim `tenant_id`).
2. A servlet filter (`TenantFilter`) intercepts incoming requests, validates tenant authorization, and binds the tenant ID to a scoped `ThreadLocal<String>` in `TenantContext`.
3. In `finally` blocks, `TenantContext.clear()` is guaranteed to execute to prevent virtual thread reuse leakage.
4. All repository queries filter explicitly by `tenantId`.
5. Database tables include composite indexes prefixed by `tenant_id` (e.g. `idx_intents_tenant_agent ON purchase_intents (tenant_id, agent_id)`).

## Consequences
### Positive
- Lowest operational cost and single consolidated Flyway migration run.
- Seamless connection pooling via HikariCP.
- Easy cross-tenant global analytics and aggregated billing when needed.

### Negative
- Requires strict vigilance in repository query construction to avoid tenant leakage bugs (enforced via integration test suites).
