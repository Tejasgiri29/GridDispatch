# ADR-004: Double-Entry Ledger Invariance & Immutability

## Status
Accepted

## Context
Financial platforms and agent commerce require bulletproof auditability and regulatory compliance (SOC 1/2, Sarbanes-Oxley). Standard single-entry balance tables (e.g. `UPDATE accounts SET balance = balance + 100`) are vulnerable to race conditions, silent software defects, and untraceable money generation.

## Decision
We enforce a strict **Double-Entry General Ledger** architecture:
1. Every economic event generates a `JournalEntry` containing at least two `JournalLine` records.
2. Mathematical Invariant:
   $$\sum \text{Debits} \equiv \sum \text{Credits}$$
   If `debitsSum != creditsSum`, `LedgerImbalanceException` is thrown and the transaction rolls back immediately.
3. Immutability Guarantee:
   - Posted journal entries and lines can never be updated (`UPDATE`) or deleted (`DELETE`).
   - Any financial correction or refund MUST be achieved by posting an explicit **Reversal Journal Entry** with inverted debit and credit legs.
4. Account Balances:
   - Account balances are denormalized aggregates computed by applying signed debit/credit rules based on the account category:
     - Asset / Expense: Debits increase balance (+), Credits decrease balance (-).
     - Liability / Equity / Revenue: Credits increase balance (+), Debits decrease balance (-).

## Consequences
### Positive
- Financial auditability is mathematically proven.
- Trial balance reports can continuously verify system integrity in production.
- Forensic root-cause analysis is always possible from raw historical lines.

### Negative
- Higher database storage footprint compared to single-row balance mutation.
- Requires strict double-entry accounting domain knowledge from developers.
