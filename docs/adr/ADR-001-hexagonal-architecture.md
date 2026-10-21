# ADR-001: Hexagonal (Ports & Adapters) Architecture

## Status
Accepted

## Context
In both AgentGuard and GridDispatch, business rules (e.g. mathematical ledger balance, mandate spend policies, zero-oversell stock checks, Pareto dispatch scoring) represent the highest-value core logic of the enterprise. Tightly coupling this domain logic to frameworks (Spring MVC, JPA/Hibernate, Kafka, HTTP clients) creates fragile systems that are difficult to unit-test and migrate across cloud providers or messaging protocols.

## Decision
We adopt the Hexagonal Architecture (Ports and Adapters) pattern across both platforms:
1. **Domain Layer**: Contains pure Java entities, value objects (`Money`, `Coordinates`), domain exceptions, and domain policies (`MandatePolicy`, `DispatchScoringEngine`, `RiskPolicyEngine`). This layer contains zero imports from Spring Framework or web libraries.
2. **Ports Layer**: Declares Java interfaces (`PaymentGatewayPort`, `RoutingPort`, `WeatherPort`, `FraudScorePort`) defining the contracts required by application use-cases.
3. **Application Services**: Orchestrates business workflows (`LedgerService`, `OrderSagaOrchestrator`, `InventoryService`) by calling domain policies and port interfaces within transactional boundaries.
4. **Adapters Layer**: Implements ports via specific technologies (PostgreSQL JPA repositories, Kafka producers/consumers, Redis Lua clients, Mock external APIs).

## Consequences
### Positive
- Domain policies can be 100% unit-tested with sub-millisecond execution times without mocking database or network sockets.
- External providers (e.g. Stripe vs. Adyen, Mapbox vs. OSRM) can be swapped cleanly by implementing port interfaces without modifying a single line of domain code.

### Negative
- Requires mapping between domain models, DTOs, and persistence entities.
- Increases the number of files and abstractions compared to an ad-hoc 3-tier CRUD architecture.
