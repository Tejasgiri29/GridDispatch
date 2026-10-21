# Advanced Java 21 & JVM Technical Interview Questions

Deep-dive Java interview questions derived from the implementation choices in **future-java-platforms**.

---

## Question 1: How do Virtual Threads (Project Loom) work internally in Java 21, and what is "Carrier Thread Pinning"?

### Model Answer
- **Mechanism**: Virtual threads are lightweight user-space threads managed by the JVM rather than the operating system. The JVM maintains a pool of OS "carrier threads" (typically sized to `Runtime.getRuntime().availableProcessors()`). When a virtual thread executes non-blocking CPU work, it runs on a carrier thread. When it performs a blocking I/O operation (e.g. `SocketInputStream.read()`, JDBC query), the JVM unmounts the virtual thread, preserving its call stack on the Java heap, and frees the carrier thread to execute other virtual threads. Once the I/O completes, the virtual thread is re-mounted onto an available carrier thread.
- **Pinning**: A virtual thread is "pinned" to its carrier thread if it blocks inside a `synchronized` block/method or inside a native JNI call. When pinned, the underlying OS carrier thread cannot be unmounted, degrading scalability.
- **Solution in Project**: We replaced `synchronized` blocks with `java.util.concurrent.locks.ReentrantLock`, which allows virtual threads to unmount cleanly during lock waits.

---

## Question 2: Why should you avoid `BigDecimal(double)` and how does Java handle currency precision in high-frequency trading and ledgers?

### Model Answer
- **The Pitfall**: `new BigDecimal(0.1)` does not produce `0.1` because `0.1` cannot be represented exactly as a binary floating-point number. It evaluates to `0.1000000000000000055511151231257827021181583404541015625`, introducing cumulative financial drift.
- **Best Practice**:
  1. Always use `BigDecimal.valueOf(double)` or `new BigDecimal(String)` (e.g. `new BigDecimal("0.1")`).
  2. In our domain layer, we encapsulated currency inside an immutable `Money` Value Object that enforces `RoundingMode.HALF_EVEN` (Banker's Rounding) and currency compatibility checks before mathematical operations.
  3. In the database, we use `NUMERIC(19, 4)` rather than `FLOAT` or `DOUBLE PRECISION` to preserve exact decimal precision.

---

## Question 3: What are the trade-offs between ZGC, Generational ZGC, and G1GC for low-latency Java applications?

### Model Answer
- **G1GC (Garbage-First)**: Default in Java 21. Divides heap into regions and prioritizes regions with the most garbage. Excellent overall throughput, but pause times can spike to 50ms - 200ms during mixed collections on large heaps.
- **ZGC (Z Garbage Collector)**: A concurrent, scalable low-latency garbage collector. Performs all expensive phases (mark, relocate, reference processing) concurrently with application threads using colored pointers and load barriers. Guarantees max pause times `< 1ms` regardless of heap size (from megabytes to terabytes).
- **Generational ZGC (Java 21+)**: Introduces separate young and old generations to ZGC, reducing CPU overhead by 20-30% while maintaining sub-millisecond pause times. Recommended for our real-time telemetry pipelines and financial risk scoring engines.
