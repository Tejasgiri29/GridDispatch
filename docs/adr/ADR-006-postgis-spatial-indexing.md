# ADR-006: PostGIS Spatial Indexing for Fleet Routing & Geofencing

## Status
Accepted

## Context
GridDispatch coordinates hundreds of autonomous delivery drones, electric vans, and cargo e-bikes across urban and regional hubs. Application-layer distance calculations (e.g. iterating over all vehicles in Java memory and computing Haversine formula) scale as $O(N)$ and become a bottleneck when vehicle counts grow, while failing to provide spatial containment checks (geofencing) or nearest-neighbor searches.

## Decision
We utilize the **PostGIS extension for PostgreSQL** with Spatial Generalized Search Trees (GiST):
1. Geographic coordinates are stored as PostGIS `GEOMETRY(Point, 4326)` columns.
2. Spatial indexes are created using GiST:
   ```sql
   CREATE INDEX idx_assets_geom_gist ON assets USING GIST (geom);
   CREATE INDEX idx_warehouses_geom_gist ON warehouses USING GIST (geom);
   CREATE INDEX idx_charging_stations_geom_gist ON charging_stations USING GIST (geom);
   ```
3. Queries for nearby idle vehicles, warehouse staging zones, and emergency charging stations leverage native spatial operators (`ST_DWithin`, `ST_Distance`, `<->` KNN operator).

## Consequences
### Positive
- Sub-millisecond candidate filtering across 100k+ assets.
- Rich native geospatial support for polygon geofences, corridors, and elevation profiles.
- Leverages the existing robust PostgreSQL infrastructure without introducing a separate spatial database.

### Negative
- Requires PostGIS extension enabled on the Postgres cluster (`CREATE EXTENSION IF NOT EXISTS postgis`).
- Spatial queries must be tested with `EXPLAIN ANALYZE` to ensure GiST index usage over sequential table scans.
