import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Asset, Warehouse, ChargingStation } from '../../types';

interface LiveFleetMapProps {
  assets: Asset[];
  warehouses: Warehouse[];
  stations: ChargingStation[];
  selectedAssetId?: string | null;
  onSelectAsset?: (asset: Asset) => void;
}

// Custom DivIcons for crisp modern rendering without 404 png dependencies
const createAssetIcon = (asset: Asset, isSelected: boolean) => {
  const isCharging = asset.status === 'CHARGING';
  const isEnRoute = asset.status === 'EN_ROUTE';
  const colorBg = isCharging
    ? 'bg-amber-500'
    : isEnRoute
    ? 'bg-emerald-500'
    : 'bg-sky-500';

  const ring = isSelected ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-125' : '';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center transition-transform ${ring}">
        <div class="w-8 h-8 rounded-full ${colorBg} text-slate-950 font-bold flex items-center justify-center shadow-lg border-2 border-white text-[10px]">
          ${asset.type === 'AUTONOMOUS_DRONE' ? '🚁' : asset.type === 'CARGO_EBIKE' ? '🚲' : '🚚'}
        </div>
        <div class="absolute -bottom-4 bg-slate-950/90 text-white font-mono text-[9px] px-1 rounded border border-slate-700 whitespace-nowrap">
          ${asset.currentBatteryPercent}%
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createWarehouseIcon = (warehouse: Warehouse) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="flex items-center justify-center">
        <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shadow-md border-2 border-slate-200 text-xs">
          🏭
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const createStationIcon = (station: ChargingStation) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="flex items-center justify-center">
        <div class="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shadow-md border-2 border-slate-200 text-xs">
          ⚡
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

export const LiveFleetMap: React.FC<LiveFleetMapProps> = ({
  assets,
  warehouses,
  stations,
  selectedAssetId,
  onSelectAsset
}) => {
  // Default coordinates centered on New York / NJ metropolitan logistics corridor
  const defaultCenter: [number, number] = [40.730610, -73.935242];

  return (
    <div className="w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-800 relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="dark-tiles w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Warehouses */}
        {warehouses.map(wh => (
          <Marker
            key={wh.id}
            position={[wh.latitude, wh.longitude]}
            icon={createWarehouseIcon(wh)}
          >
            <Popup>
              <div className="p-2 space-y-1">
                <div className="font-bold text-white text-sm">{wh.name}</div>
                <div className="text-xs text-indigo-400 font-mono">Code: {wh.code}</div>
                <div className="text-[11px] text-slate-300">
                  Primary Fulfillment Center &amp; Zero-Oversell Hub
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Charging Stations */}
        {stations.map(st => (
          <Marker
            key={st.id}
            position={[st.latitude, st.longitude]}
            icon={createStationIcon(st)}
          >
            <Popup>
              <div className="p-2 space-y-1">
                <div className="font-bold text-white text-sm">{st.name}</div>
                <div className="text-xs text-emerald-400 font-mono">
                  {st.availablePlugs} / {st.totalPlugs} Plugs Available
                </div>
                <div className="text-[11px] text-slate-300">
                  Rating: <span className="font-bold text-white">{st.powerRatingKw} kW</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Grid Intensity: <span className="font-mono text-emerald-400">{st.gridCarbonIntensityGco2Kwh} gCO₂/kWh</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Assets / Autonomous Fleets */}
        {assets.map(asset => {
          const isSelected = asset.id === selectedAssetId;
          return (
            <Marker
              key={asset.id}
              position={[asset.currentLatitude, asset.currentLongitude]}
              icon={createAssetIcon(asset, isSelected)}
              eventHandlers={{
                click: () => onSelectAsset && onSelectAsset(asset)
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 min-w-[180px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{asset.code}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300">
                      {asset.type}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-semibold text-emerald-400">{asset.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Speed:</span>
                      <span className="font-mono text-white">{asset.currentSpeedKmh.toFixed(1)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Battery:</span>
                      <span className="font-mono font-bold text-emerald-400">{asset.currentBatteryPercent}%</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
