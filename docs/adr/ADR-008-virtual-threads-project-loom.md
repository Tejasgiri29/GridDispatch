# ADR-008: Java 21 Virtual Threads (Project Loom) Adoption

## Status
Accepted

## Context
High-concurrency microservices performing frequent blocking I/O (JDBC database queries, Redis Lua calls, Kafka message publishing, HTTP REST port calls) traditionally suffered from carrier thread exhaustion under high load with standard platform threads. Reactive programming (e.g. Project Reactor, WebFlux) solves the thread count problem but introduces severe code complexity, complex call stacks, difficult debugging, and context-propagation issues (e.g. `ThreadLocal` loss for security and tenant context).

## Decision
We standardize on **Java 21 LTS with Virtual Threads (Project Loom)**:
1. Enabled globally via Spring Boot 3.3 configuration:
   ```yaml
   spring:
     threads:
       virtual:
         enabled: true
   ```
2. The standard synchronous programming model is preserved: clean imperative code, standard `try-catch` blocks, standard debugger stack traces, and seamless `ThreadLocal` inheritance for `TenantContext`.
3. Blocking operations (e.g. `socketRead`, JDBC blocking queries) unmount the virtual thread from the underlying OS carrier thread automatically, allowing a small pool of carrier threads (equal to CPU cores) to process tens of thousands of concurrent requests.

## Consequences
### Positive
- Massive throughput scalability (10k+ concurrent requests) with low memory footprint (~2 KB per virtual thread).
- Retains standard imperative Java readability and effortless stack tracing.
- Eliminates reactive debugging hell and mono/flux operator chaining.

### Negative
- Pinning caution: Code using `synchronized` blocks that perform blocking I/O can pin the carrier thread. We enforce `ReentrantLock` throughout the codebase where explicit locking is required.
