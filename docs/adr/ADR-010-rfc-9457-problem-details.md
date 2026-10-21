# ADR-010: RFC 9457 Standardized Problem Details for HTTP APIs

## Status
Accepted

## Context
Non-standardized error responses across microservices (e.g. ad-hoc JSON `{ "error": "something failed" }` vs strings vs HTML stacktraces) create brittle client integrations, make autonomous AI agent error recovery impossible, and hinder production incident debugging.

## Decision
We adopt **IETF RFC 9457 (Problem Details for HTTP APIs)** globally via `@ControllerAdvice`:
1. Every non-2xx HTTP response returns `application/problem+json` media type.
2. The standard structure is enforced:
   ```json
   {
     "type": "https://api.agentguard.io/errors/mandate-violation",
     "title": "Mandate Constraint Violated",
     "status": 422,
     "detail": "Purchase intent amount $450.00 exceeds single-transaction limit of $250.00",
     "instance": "/api/v1/purchase-intents",
     "timestamp": "2026-10-21T00:00:00Z",
     "code": "MANDATE_EXCEEDED"
   }
   ```
3. A centralized `GlobalExceptionHandler` maps domain exceptions:
   - `MandateViolationException` -> HTTP 422 Unprocessable Entity
   - `LedgerImbalanceException` -> HTTP 400 Bad Request
   - `InsufficientFundsException` -> HTTP 402 Payment Required
   - `RateLimitExceededException` -> HTTP 429 Too Many Requests (with `Retry-After`)
   - `IdempotencyConflictException` -> HTTP 409 Conflict
   - `ResourceNotFoundException` -> HTTP 404 Not Found

## Consequences
### Positive
- AI agents consuming the API can programmatically parse machine-readable error `type` and `code` URIs to take automated corrective actions (e.g. requesting human mandate approval).
- Frontend error toasts and debuggers parse uniform metadata.
- Industry-standard compliance for enterprise API design.

### Negative
- Requires centralized exception handler maintenance across all backend modules.
