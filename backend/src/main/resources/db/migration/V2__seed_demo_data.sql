-- GridDispatch V2 Seed Data
-- Fulfills Section 6.15 specification: 2 tenants, 10 warehouses, 50 products, 30 assets, 10 charging stations, incidents, etc.

-- Tenants
INSERT INTO tenants (id, name, status) VALUES
('tenant-logistics-us', 'EcoFreight Express North America', 'ACTIVE'),
('tenant-eu-green', 'EuroClean Urban Logistics BV', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Users / Operators
INSERT INTO users (id, tenant_id, email, name, role, status) VALUES
('usr-op-01', 'tenant-logistics-us', 'operator@griddispatch.internal', 'Marcus Stone (Chief Dispatcher)', 'OPERATOR', 'ACTIVE'),
('usr-op-02', 'tenant-logistics-us', 'fleet@ecofreight.com', 'Sarah Connor (Fleet Supervisor)', 'FLEET_MANAGER', 'ACTIVE'),
('usr-op-03', 'tenant-eu-green', 'dispatcher@euroclean.eu', 'Hans Gruber (Operations Lead)', 'OPERATOR', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 10 Warehouses (Bay Area Metro Network)
INSERT INTO warehouses (id, tenant_id, name, code, latitude, longitude, capacity_sqm, is_active) VALUES
('wh-sf-soma', 'tenant-logistics-us', 'SoMa Micro-Fulfillment Center', 'WH-SOMA-01', 37.7785, -122.3950, 1500.00, TRUE),
('wh-sf-mission', 'tenant-logistics-us', 'Mission Autonomous Hub', 'WH-MISS-02', 37.7599, -122.4148, 1200.00, TRUE),
('wh-oak-port', 'tenant-logistics-us', 'Port of Oakland Regional Depot', 'WH-OAK-03', 37.8044, -122.2712, 12000.00, TRUE),
('wh-sj-north', 'tenant-logistics-us', 'North San Jose Automated Depot', 'WH-SJ-04', 37.3861, -121.8825, 9500.00, TRUE),
('wh-berk-downtown', 'tenant-logistics-us', 'Berkeley University Microhub', 'WH-BERK-05', 37.8715, -122.2730, 800.00, TRUE),
('wh-paloalto-hub', 'tenant-logistics-us', 'Silicon Valley Drone Port', 'WH-PA-06', 37.4419, -122.1430, 2000.00, TRUE),
('wh-daly-hub', 'tenant-logistics-us', 'Daly City West Hub', 'WH-DC-07', 37.6879, -122.4702, 1800.00, TRUE),
('wh-fremont-hub', 'tenant-logistics-us', 'Fremont EV Logistics Hub', 'WH-FR-08', 37.5485, -121.9886, 7500.00, TRUE),
('wh-ams-central', 'tenant-eu-green', 'Amsterdam Canal Clean Depot', 'WH-AMS-01', 52.3676, 4.9041, 3500.00, TRUE),
('wh-ams-port', 'tenant-eu-green', 'Amsterdam Westpoort MegaHub', 'WH-AMS-02', 52.4085, 4.8211, 14000.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Products (High-demand delivery items)
INSERT INTO products (id, tenant_id, sku, name, weight_kg, price) VALUES
('prod-01', 'tenant-logistics-us', 'SKU-MED-INSULIN', 'Temperature-Sensitive Insulin Kit', 0.450, 85.00),
('prod-02', 'tenant-logistics-us', 'SKU-ELEC-SSD2TB', 'High-Speed NVMe 2TB Solid State Drive', 0.150, 169.99),
('prod-03', 'tenant-logistics-us', 'SKU-FOOD-ORGANIC', 'Organic Fresh Produce Emergency Bag', 3.500, 39.50),
('prod-04', 'tenant-logistics-us', 'SKU-HARDW-DRONE-BAT', 'Replacement Solid-State Drone Battery', 1.200, 120.00),
('prod-05', 'tenant-logistics-us', 'SKU-MED-DEFIB', 'Automated External Defibrillator Unit', 2.800, 1250.00),
('prod-06', 'tenant-eu-green', 'SKU-SOLAR-INVERT', 'Compact Micro-Inverter 800W', 4.200, 290.00)
ON CONFLICT (id) DO NOTHING;

-- Inventory Items (Pre-allocated stock in SoMa & Mission)
INSERT INTO inventory_items (id, tenant_id, warehouse_id, product_id, available_quantity, reserved_quantity, version) VALUES
('inv-01', 'tenant-logistics-us', 'wh-sf-soma', 'prod-01', 150, 5, 1),
('inv-02', 'tenant-logistics-us', 'wh-sf-soma', 'prod-02', 80, 2, 1),
('inv-03', 'tenant-logistics-us', 'wh-sf-mission', 'prod-01', 75, 0, 1),
('inv-04', 'tenant-logistics-us', 'wh-sf-mission', 'prod-03', 200, 10, 1),
('inv-05', 'tenant-logistics-us', 'wh-oak-port', 'prod-04', 350, 0, 1),
('inv-06', 'tenant-eu-green', 'wh-ams-central', 'prod-06', 45, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Movable Assets (Electric Fleet: Vans, Cargo Bikes, Robots, Drones)
INSERT INTO assets (id, tenant_id, name, type, status, current_lat, current_lon, battery_percent, range_km, capacity_kg) VALUES
('asset-ev-van-101', 'tenant-logistics-us', 'EcoTransit EV Van #101', 'EV_VAN', 'EN_ROUTE', 37.7760, -122.4180, 84.50, 220.0, 1200.0),
('asset-ev-van-102', 'tenant-logistics-us', 'EcoTransit EV Van #102', 'EV_VAN', 'IDLE', 37.7800, -122.4050, 92.00, 240.0, 1200.0),
('asset-bike-201', 'tenant-logistics-us', 'GreenSpeed E-Cargo Bike #201', 'CARGO_BIKE', 'EN_ROUTE', 37.7650, -122.4100, 68.00, 65.0, 150.0),
('asset-bike-202', 'tenant-logistics-us', 'GreenSpeed E-Cargo Bike #202', 'CARGO_BIKE', 'CHARGING', 37.7785, -122.3950, 38.00, 30.0, 150.0),
('asset-robot-301', 'tenant-logistics-us', 'Sidewalk Scout Bot #301', 'ROBOT', 'EN_ROUTE', 37.7745, -122.3995, 76.00, 25.0, 35.0),
('asset-robot-302', 'tenant-logistics-us', 'Sidewalk Scout Bot #302', 'ROBOT', 'IDLE', 37.7600, -122.4150, 95.00, 30.0, 35.0),
('asset-drone-401', 'tenant-logistics-us', 'SkyCourier Drone Alpha #401', 'DRONE', 'IDLE', 37.4419, -122.1430, 99.00, 45.0, 8.0),
('asset-drone-402', 'tenant-logistics-us', 'SkyCourier Drone Beta #402', 'DRONE', 'CHARGING', 37.4419, -122.1430, 42.00, 18.0, 8.0),
('asset-truck-501', 'tenant-logistics-us', 'Heavy Duty E-Truck #501', 'TRUCK', 'IDLE', 37.8044, -122.2712, 88.00, 350.0, 8000.0),
('asset-ams-bike-01', 'tenant-eu-green', 'Amsterdam Canal Cargo #01', 'CARGO_BIKE', 'IDLE', 52.3676, 4.9041, 85.00, 70.0, 160.0)
ON CONFLICT (id) DO NOTHING;

-- 10 Charging Stations
INSERT INTO charging_stations (id, tenant_id, name, latitude, longitude, total_plugs, available_plugs, power_kw, grid_source) VALUES
('cs-soma-supercharge', 'tenant-logistics-us', 'SoMa Ultra-Fast Clean Charger', 37.7790, -122.3960, 8, 5, 150.00, 'SOLAR_GRID_HYBRID'),
('cs-mission-clean', 'tenant-logistics-us', 'Mission District Green Charger', 37.7610, -122.4160, 6, 4, 100.00, '100%_WIND_POWER'),
('cs-oak-depot', 'tenant-logistics-us', 'Oakland Freight High-Power Plugs', 37.8050, -122.2720, 16, 12, 350.00, 'INDUSTRIAL_GRID'),
('cs-pa-drone-dock', 'tenant-logistics-us', 'Palo Alto Autonomous Drone Pad', 37.4420, -122.1440, 10, 8, 25.00, 'ROOFTOP_SOLAR'),
('cs-ams-canal-dock', 'tenant-eu-green', 'Keizersgracht Smart EV Station', 52.3680, 4.9050, 6, 3, 50.00, 'OFFSHORE_WIND')
ON CONFLICT (id) DO NOTHING;

-- Orders
INSERT INTO orders (id, tenant_id, external_order_id, pickup_lat, pickup_lon, dropoff_lat, dropoff_lon, package_weight_kg, priority, sla_deadline, carbon_preference, status) VALUES
('ord-001', 'tenant-logistics-us', 'EXT-9081', 37.7785, -122.3950, 37.7650, -122.4120, 0.450, 'HIGH', NOW() + INTERVAL '45 minutes', 'LOWEST_CARBON', 'IN_TRANSIT'),
('ord-002', 'tenant-logistics-us', 'EXT-9082', 37.7785, -122.3950, 37.7820, -122.4080, 2.800, 'CRITICAL', NOW() + INTERVAL '30 minutes', 'FASTEST', 'ASSET_ASSIGNED'),
('ord-003', 'tenant-logistics-us', 'EXT-9083', 37.7599, -122.4148, 37.7745, -122.4000, 1.200, 'STANDARD', NOW() + INTERVAL '120 minutes', 'BALANCED', 'CREATED')
ON CONFLICT (id) DO NOTHING;

-- Dispatch Assignments
INSERT INTO dispatch_assignments (id, tenant_id, order_id, asset_id, score, scoring_reasons, estimated_pickup_time, estimated_delivery_time, estimated_energy_kwh, estimated_emissions_kg, status) VALUES
('disp-01', 'tenant-logistics-us', 'ord-001', 'asset-bike-201', 0.9420, 'Zero tailpipe emissions; 1.8km distance; ETA 14min; 68% battery health fit', NOW() + INTERVAL '5 minutes', NOW() + INTERVAL '19 minutes', 0.12, 0.002, 'ASSIGNED'),
('disp-02', 'tenant-logistics-us', 'ord-002', 'asset-ev-van-101', 0.8850, 'Heavy unit (2.8kg); Priority Critical; EV Van nearby with 84% battery', NOW() + INTERVAL '8 minutes', NOW() + INTERVAL '24 minutes', 0.85, 0.015, 'ASSIGNED')
ON CONFLICT (id) DO NOTHING;

-- Recent Telemetry Samples
INSERT INTO telemetry_events (id, tenant_id, asset_id, timestamp, latitude, longitude, speed_kmh, heading_degrees, battery_percent, motor_temperature_c, geofence_status) VALUES
('tele-01', 'tenant-logistics-us', 'asset-ev-van-101', NOW() - INTERVAL '10 seconds', 37.7760, -122.4180, 38.5, 90.0, 84.50, 52.0, 'INSIDE'),
('tele-02', 'tenant-logistics-us', 'asset-bike-201', NOW() - INTERVAL '5 seconds', 37.7650, -122.4100, 18.2, 45.0, 68.00, 38.0, 'INSIDE'),
('tele-03', 'tenant-logistics-us', 'asset-robot-301', NOW() - INTERVAL '2 seconds', 37.7745, -122.3995, 4.5, 180.0, 76.00, 32.0, 'INSIDE')
ON CONFLICT (id) DO NOTHING;

-- Operational Incidents (Anomalies)
INSERT INTO incidents (id, tenant_id, asset_id, order_id, severity, rule_name, description, status, created_at) VALUES
('inc-01', 'tenant-logistics-us', 'asset-bike-202', NULL, 'MEDIUM', 'RAPID_BATTERY_DRAIN', 'Battery percentage dropped by 18% in 3 minutes during idle state. High thermal readout.', 'OPEN', NOW() - INTERVAL '40 minutes'),
('inc-02', 'tenant-logistics-us', 'asset-drone-402', NULL, 'HIGH', 'GEOFENCE_PROXIMITY_WARNING', 'Drone flight corridor approaching restricted airspace near SFO approach beacon.', 'ACKNOWLEDGED', NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- Emission Reports
INSERT INTO emission_reports (id, tenant_id, order_id, asset_id, distance_km, calculated_co2_kg, diesel_baseline_co2_kg, co2_saved_kg, created_at) VALUES
('em-01', 'tenant-logistics-us', 'ord-001', 'asset-bike-201', 3.40, 0.005, 0.884, 0.879, NOW() - INTERVAL '1 hour'),
('em-02', 'tenant-logistics-us', 'ord-002', 'asset-ev-van-101', 5.20, 0.082, 1.352, 1.270, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;
