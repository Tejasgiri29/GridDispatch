# Spring Boot 3.3 & Cloud-Native Technical Interview Questions

Deep-dive Spring Boot questions derived from **future-java-platforms**.

---

## Question 1: How does Spring's `@Transactional` annotation work under the hood, and what are common traps where it silently fails?

### Model Answer
- **Mechanism**: Spring uses Dynamic Proxies (or CGLIB) to wrap beans annotated with `@Transactional`. When an external caller invokes a transactional method, the proxy intercepts the call, acquires a database connection from the `DataSource` (via `TransactionSynchronizationManager`), disables auto-commit (`connection.setAutoCommit(false)`), begins the transaction, proceeds to the actual method, and commits or rolls back based on exceptions.
- **Common Failure Traps**:
  1. **Self-Invocation**: Calling a `@Transactional` method from another method within the same bean bypasses the proxy entirely, executing without a transaction. Fix: Move the method to a separate service or inject the self-bean.
  2. **Checked Exceptions**: By default, Spring only rolls back on unchecked (`RuntimeException` and `Error`). It does NOT roll back on checked `Exception`. Fix: Explicitly declare `@Transactional(rollbackFor = Exception.class)`.
  3. **Non-Public Methods**: `@Transactional` on `private` or `protected` methods is silently ignored by standard proxies.
  4. **Premature Thread Switching**: Spawning child threads inside a transactional method causes child threads to lose the `ThreadLocal` connection binding.

---

## Question 2: How do you implement ThreadLocal cleanup when using Virtual Threads in Spring Boot?

### Model Answer
- In standard thread-pool architectures (e.g. Tomcat 200 platform threads), failing to call `threadLocal.remove()` causes data leakage when the thread is returned to the pool and assigned to another user request.
- With Virtual Threads, thousands of ephemeral threads are created and discarded. However, virtual threads are still pooled at the carrier level, and lingering `ThreadLocal` references on large objects prevent garbage collection.
- **Solution in Project**:
  In our `TenantFilter`, we encapsulate tenant context manipulation in a strict `try-finally` block:
  ```java
  try {
      TenantContext.setCurrentTenant(tenantId);
      chain.doFilter(request, response);
  } finally {
      TenantContext.clear(); // Guarantees removal on every request exit
  }
  ```

---

## Question 3: How does Spring Boot 3.3 integrate with OpenTelemetry for distributed tracing?

### Model Answer
- Spring Boot 3.x replaced Spring Cloud Sleuth with **Micrometer Tracing**.
- By including `micrometer-tracing-bridge-otel` and `opentelemetry-exporter-otlp`, Spring Boot automatically instruments incoming HTTP requests, outbound `RestTemplate`/`WebClient` calls, and Kafka consumers/producers with W3C Trace Context headers (`traceparent`, `tracestate`).
- Every log line automatically includes `traceId` and `spanId` (MDC injection), enabling correlation in Grafana Tempo and Loki.
