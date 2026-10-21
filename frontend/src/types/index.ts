export interface Warehouse {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  weightKg: number;
  unitVolumeM3: number;
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  warehouseCode?: string;
  sku: string;
  productName?: string;
  availableQuantity: number;
  reservedQuantity: number;
  safetyStockLevel: number;
}

export interface InventoryReservation {
  id: string;
  orderId: string;
  sku: string;
  reservedQuantity: number;
  expiresAt: string;
  status: 'PENDING' | 'COMMITTED' | 'EXPIRED' | 'CANCELLED';
}

export interface Order {
  id: string;
  orderNumber: string;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  weightKg: number;
  volumeM3: number;
  requestedDeliveryTime?: string;
  status: 'SUBMITTED' | 'INVENTORY_RESERVED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  assignedAssetId?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  code: string;
  vin: string;
  type: 'EV_VAN' | 'ELECTRIC_SEMI' | 'AUTONOMOUS_DRONE' | 'CARGO_EBIKE';
  status: 'IDLE' | 'EN_ROUTE' | 'CHARGING' | 'MAINTENANCE';
  maxPayloadKg: number;
  batteryCapacityKwh: number;
  currentBatteryPercent: number;
  currentLatitude: number;
  currentLongitude: number;
  currentSpeedKmh: number;
  lastHeartbeatAt?: string;
}

export interface TelemetryEvent {
  id: string;
  assetId: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  batteryPercent: number;
  energyConsumptionKw: number;
  ambientTemperatureC: number;
  timestamp: string;
}

export interface Route {
  id: string;
  assetId: string;
  originLatitude: number;
  originLongitude: number;
  destLatitude: number;
  destLongitude: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  carbonEmissionGrams: number;
  polyline?: string;
}

export interface DispatchAssignment {
  id: string;
  orderId: string;
  assetId: string;
  routeId: string;
  assignedAt: string;
  status: 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  efficiencyScore: number;
  co2SavingsGrams: number;
}

export interface ChargingStation {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  totalPlugs: number;
  availablePlugs: number;
  powerRatingKw: number;
  gridCarbonIntensityGco2Kwh: number;
}

export interface ChargingSchedule {
  id: string;
  assetId: string;
  stationId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  energyAmountKwh: number;
  estimatedCost: number;
  status: 'PLANNED' | 'CHARGING' | 'COMPLETED' | 'CANCELLED';
}

export interface EmissionReport {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalKmDriven: number;
  totalKwhConsumed: number;
  totalEmissionsKgCo2: number;
  avoidedDieselEmissionsKgCo2: number;
  carbonReductionPercent: number;
}

export interface Incident {
  id: string;
  assetId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  detectedAt: string;
  resolvedAt?: string;
}

export interface AnomalyRule {
  id: string;
  name: string;
  conditionType: string;
  thresholdValue: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  active: boolean;
}
