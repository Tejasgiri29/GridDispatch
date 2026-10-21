# Testing Strategy & Quality Assurance Architecture

Both platforms enforce a multi-tiered test pyramid ensuring domain mathematical invariance, transactional isolation, and sub-millisecond regressions are prevented before code reaches production.

---

## 1. Test Pyramid Overview

```text
         ▲
        / \     E2E / Load Tests (k6, 500 VUs)
       /   \    ------------------------------
      /     \   Integration Tests (Testcontainers, PostGIS, Kafka, Redis)
     /       \  ---------------------------------------------------------
    /         \ Unit Tests (JUnit 5, Mockito, Pure Domain Logic)
   /___________\ -----------------------------------------------------------
```

---

## 2. Unit Testing Strategy

- **Domain Policies Tested Without Frameworks**:
  - `MandatePolicyTest`: Verifies single-transaction maximums, daily budget tracking, and vendor allowlisting without booting Spring.
  - `DispatchScoringEngineTest`: Verifies Pareto score weighting, payload limits, and range buffers across edge cases (0% battery, overloaded drone).
  - `LedgerServiceTest`: Asserts that any attempt to post unbalanced debits and credits throws `LedgerImbalanceException`.
- **Execution Speed**: 100% of unit tests execute in `< 1.5 seconds` across the entire monorepo.

---

## 3. Concurrency & Invariant Testing

### Zero-Oversell Multi-Threaded Stress Test
Implemented in `InventoryServiceTest`:
```java
@Test
void concurrentReservations_mustNeverOversell() throws InterruptedException {
    int threads = 50;
    int availableUnits = 10;
    ExecutorService executor = Executors.newFixedThreadPool(threads);
    CountDownLatch latch = new CountDownLatch(threads);
    AtomicInteger successes = new AtomicInteger();
    AtomicInteger rejections = new AtomicInteger();

    for (int i = 0; i < threads; i++) {
        executor.submit(() -> {
            try {
                inventoryService.reserveInventory("wh-1", "SKU-TEST", 1, 60);
                successes.incrementAndGet();
            } catch (InsufficientInventoryException e) {
                rejections.incrementAndGet();
            } finally {
                latch.countDown();
            }
        });
    }

    latch.await();
    assertEquals(10, successes.get(), "Exactly available units must be reserved");
    assertEquals(40, rejections.get(), "Excess concurrent reservations must be rejected");
}
```

---

## 4. Running Test Suites

```bash
# Run all unit tests across all modules
mvn clean test

# Run integration tests
mvn verify -Pintegration-tests

# Run k6 load tests
k6 run tests/load/agentguard-burst.js
k6 run tests/load/griddispatch-telemetry.js
```
