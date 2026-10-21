-- GridDispatch PostgreSQL & PostGIS Initial Schema
-- Enforces Multi-Tenancy, Spatial Geometry, Pessimistic Inventory Locking, and Telemetry Timeseries

CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_gd_users_email UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity_sqm NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_warehouses_code UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    weight_kg NUMERIC(8, 3) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_products_sku UNIQUE(tenant_id, sku)
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
    product_id VARCHAR(64) NOT NULL REFERENCES products(id),
    available_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_inv_warehouse_product UNIQUE(tenant_id, warehouse_id, product_id),
    CONSTRAINT chk_positive_inventory CHECK (available_quantity >= 0 AND reserved_quantity >= 0)
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    external_order_id VARCHAR(128),
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lon DOUBLE PRECISION NOT NULL,
    dropoff_lat DOUBLE PRECISION NOT NULL,
    dropoff_lon DOUBLE PRECISION NOT NULL,
    package_weight_kg NUMERIC(8, 3) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    carbon_preference VARCHAR(32) NOT NULL DEFAULT 'LOWEST_CARBON',
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
    product_id VARCHAR(64) NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'RESERVED', -- RESERVED, CONFIRMED, RELEASED
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- EV_VAN, CARGO_BIKE, ROBOT, DRONE, TRUCK
    status VARCHAR(32) NOT NULL, -- IDLE, ASSIGNED, EN_ROUTE, CHARGING, MAINTENANCE, OFFLINE, FAULTED
    current_lat DOUBLE PRECISION NOT NULL,
    current_lon DOUBLE PRECISION NOT NULL,
    battery_percent NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    range_km NUMERIC(8, 2) NOT NULL,
    capacity_kg NUMERIC(8, 2) NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_order_id VARCHAR(64) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS telemetry_events (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed_kmh NUMERIC(6, 2) NOT NULL,
    heading_degrees NUMERIC(5, 2) NOT NULL,
    battery_percent NUMERIC(5, 2) NOT NULL,
    motor_temperature_c NUMERIC(5, 2),
    geofence_status VARCHAR(32) NOT NULL DEFAULT 'INSIDE'
);

CREATE TABLE IF NOT EXISTS routes (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id),
    distance_km NUMERIC(8, 2) NOT NULL,
    estimated_duration_min INT NOT NULL,
    estimated_emissions_kg NUMERIC(8, 3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PLANNED',
    polyline_geojson TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatch_assignments (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id),
    score NUMERIC(8, 4) NOT NULL,
    scoring_reasons TEXT NOT NULL,
    estimated_pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_energy_kwh NUMERIC(8, 2) NOT NULL,
    estimated_emissions_kg NUMERIC(8, 3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ASSIGNED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS charging_stations (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_plugs INT NOT NULL DEFAULT 4,
    available_plugs INT NOT NULL DEFAULT 4,
    power_kw NUMERIC(6, 2) NOT NULL DEFAULT 50.00,
    grid_source VARCHAR(64) NOT NULL DEFAULT 'SOLAR_GRID_HYBRID'
);

CREATE TABLE IF NOT EXISTS charging_schedules (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id),
    station_id VARCHAR(64) NOT NULL REFERENCES charging_stations(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    target_battery_percent NUMERIC(5, 2) NOT NULL,
    estimated_cost_usd NUMERIC(8, 2) NOT NULL,
    estimated_carbon_kg NUMERIC(8, 3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED'
);

CREATE TABLE IF NOT EXISTS emission_reports (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id),
    distance_km NUMERIC(8, 2) NOT NULL,
    calculated_co2_kg NUMERIC(8, 3) NOT NULL,
    diesel_baseline_co2_kg NUMERIC(8, 3) NOT NULL,
    co2_saved_kg NUMERIC(8, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    asset_id VARCHAR(64) REFERENCES assets(id),
    order_id VARCHAR(64) REFERENCES orders(id),
    severity VARCHAR(32) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    rule_name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN', -- OPEN, ACKNOWLEDGED, RESOLVED
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS anomaly_rules (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(64) NOT NULL,
    threshold_value NUMERIC(10, 2) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    topic VARCHAR(128) NOT NULL,
    event_key VARCHAR(128) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Performance and spatial query indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_asset_time ON telemetry_events(tenant_id, asset_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_inv_warehouse ON inventory_items(tenant_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gd_outbox_pending ON outbox_events(status, created_at);
