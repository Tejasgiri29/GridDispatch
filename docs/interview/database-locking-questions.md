# Relational Concurrency, ACID Isolation & Database Locking Questions

Deep-dive database locking questions derived from **future-java-platforms**.

---

## Question 1: What is the difference between Optimistic Locking and Pessimistic Locking, and when should you choose each?

### Model Answer
- **Optimistic Locking**:
  - Relies on a version column (`@Version private Long version`). When updating a row, the SQL generated is `UPDATE table SET val=?, version=version+1 WHERE id=? AND version=?`.
  - If another transaction modified the row concurrently, the rows affected count is 0, throwing an `OptimisticLockException`.
  - **Best For**: Read-heavy workloads with low write contention. Avoids holding locks.
  - **Fails When**: High write contention (flash sales, high-velocity ledger settlements). High contention creates repeated retry loops, CPU thrashing, and cascading tail latencies.
- **Pessimistic Locking**:
  - Explicitly locks the row at the database level using `SELECT ... FOR UPDATE` (`LockModeType.PESSIMISTIC_WRITE`).
  - Concurrent transactions attempting to read or write the same row are blocked until the holding transaction commits or rolls back.
  - **Best For**: High write contention on scarce resources (warehouse stock, bank clearing accounts).
  - **Risk**: Deadlocks if multiple resources are locked in non-deterministic order, or connection pool exhaustion if transactions are held open too long.

---

## Question 2: How do you mathematically guarantee that two concurrent transactions will never deadlock when updating multiple accounts?

### Model Answer
- **The Coffman Deadlock Conditions**: Deadlocks occur when 4 conditions hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, and **Circular Wait**.
- **Circular Wait Elimination via Sorting**:
  - If Transaction 1 locks Account A and waits for Account B, while Transaction 2 locks Account B and waits for Account A, a circular wait occurs, triggering a database deadlock abortion.
  - If all transactions in the system are required to acquire locks in a **globally deterministic total order** (e.g. sorted ascending alphabetically by Account ID), circular wait is mathematically impossible.
  - Transaction 1 will lock Account A, then Account B.
  - Transaction 2 will also attempt to lock Account A first, block at Account A, and never hold Account B while waiting for Account A.
  - **Implementation in AgentGuard**:
    ```java
    List<String> sortedAccountIds = lines.stream()
        .map(JournalLine::getAccountId)
        .distinct()
        .sorted() // Guarantees global total ordering
        .toList();

    for (String accountId : sortedAccountIds) {
        accountRepository.findByIdWithLock(accountId);
    }
    ```

---

## Question 3: How does PostgreSQL MVCC (Multi-Version Concurrency Control) interact with `SELECT ... FOR UPDATE` and `FOR UPDATE SKIP LOCKED`?

### Model Answer
- **Standard MVCC**: In PostgreSQL, readers never block writers, and writers never block readers. An `UPDATE` does not overwrite the row in place; it writes a new version (tuple) with updated `xmin` and `xmax` transaction IDs.
- **`SELECT ... FOR UPDATE`**: Overrides default non-blocking behavior by acquiring an exclusive row-level lock in the row header. Concurrent transactions attempting to lock the same row will wait until the first transaction finishes.
- **`FOR UPDATE SKIP LOCKED`**:
  - Instead of blocking on rows locked by other transactions, it immediately skips those locked rows and returns the next unlocked rows matching the query filter.
  - **Use Case in Outbox Pattern**: Essential for concurrent workers polling the outbox table or job queue. Multiple background workers can execute `SELECT * FROM outbox_events WHERE published = false ORDER BY created_at ASC LIMIT 50 FOR UPDATE SKIP LOCKED` concurrently without blocking each other or picking up the same work items.
