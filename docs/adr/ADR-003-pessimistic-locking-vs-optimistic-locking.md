# ADR-003: Pessimistic Locking vs. Optimistic Locking for High-Contention Invariants

## Status
Accepted

## Context
Two critical subsystems require guaranteed concurrency control under high burst loads:
1. **AgentGuard Ledger Settlement**: Hundreds of autonomous agents settling debits/credits against the corporate clearing account.
2. **GridDispatch Inventory Checkout**: Hundreds of concurrent shoppers or automated restock agents buying scarce inventory for popular items with zero tolerance for oversell.

With Optimistic Locking (`@Version`), high contention leads to repeated `OptimisticLockException` rollback loops, CPU thrashing, retry storm cascading failures, and high tail latency (p99 > 800ms).

## Decision
We enforce **Pessimistic Write Locking (`SELECT ... FOR UPDATE`)**:
1. For inventory rows in `InventoryItemRepository`:
   ```java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT i FROM InventoryItem i WHERE i.warehouseId = :warehouseId AND i.sku = :sku")
   Optional<InventoryItem> findByWarehouseIdAndSkuWithLock(...);
   ```
2. For ledger accounts in `LedgerAccountRepository`:
   ```java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT a FROM LedgerAccount a WHERE a.id = :id")
   Optional<LedgerAccount> findByIdWithLock(@Param("id") String id);
   ```
3. To strictly prevent database deadlocks when multiple accounts are updated in a single journal entry:
   - Account IDs are sorted in deterministic alphabetical order before acquisition:
     ```java
     lines.stream().map(JournalLine::getAccountId).sorted().distinct().forEach(id -> accountRepo.findByIdWithLock(id));
     ```

## Consequences
### Positive
- Zero phantom reads, zero negative inventory, zero ledger balance anomalies.
- Eliminates application retry storm overhead; requests queue neatly at the database row lock.
- Deterministic locking order guarantees 0 deadlock occurrences.

### Negative
- Database connections hold row locks for the duration of the local transaction (transactions must be kept extremely brief: < 5ms).
- Long-running network I/O must never be executed inside the locked transaction block.
