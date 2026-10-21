import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Asset, Warehouse, ChargingStation, Incident } from '../types';
import { LiveFleetMap } from '../components/map/LiveFleetMap';
import {
  Truck,
  Battery,
  Leaf,
  Clock,
  RefreshCw,
  AlertTriangle,
  Radio,
  Zap,
  Activity,
  ChevronRight
} from 'lucide-react';

export const LiveOperations: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, whRes, stRes, incRes] = await Promise.all([
        apiClient.get<Asset[]>('/fleet'),
        apiClient.get<Warehouse[]>('/inventory/warehouses'),
        apiClient.get<ChargingStation[]>('/charging/stations'),
        apiClient.get<Incident[]>('/incidents')
      ]);
      setAssets(assetsRes.data);
      setWarehouses(whRes.data);
      setStations(stRes.data);
      setIncidents(incRes.data.filter(i => i.status !== 'RESOLVED'));
      if (assetsRes.data.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsRes.data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load operations data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll telemetry state every 10 seconds as backup to websocket
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalAssets = assets.length;
  const enRouteAssets = assets.filter(a => a.status === 'EN_ROUTE').length;
  const chargingAssets = assets.filter(a => a.status === 'CHARGING').length;
  const avgSoc = totalAssets > 0
    ? Math.round(assets.reduce((sum, a) => sum + a.currentBatteryPercent, 0) / totalAssets)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-7 h-7 text-emerald-400 animate-pulse" />
            Autonomous Fleet &amp; Logistics Control Tower
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time geospatial telemetry, PostGIS geofencing, and multi-objective green routing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Sync Operations
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Fleets</span>
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{enRouteAssets}</span>
            <span className="text-xs text-slate-400">/ {totalAssets} total vehicles</span>
          </div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-mono">
            ● {chargingAssets} actively charging
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Average Fleet SOC</span>
            <Battery className="w-5 h-5 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-sky-400">{avgSoc}%</span>
            <span className="text-xs text-slate-400">capacity</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            Optimized for 20-80% battery lifecycle
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">CO₂ Abated Today</span>
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">1,428</span>
            <span className="text-xs text-slate-400">kg CO₂e</span>
          </div>
          <div className="mt-1 text-xs text-emerald-400/80 font-mono">
            vs. Diesel Baseline Fleet
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className={`w-5 h-5 ${incidents.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${incidents.length > 0 ? 'text-amber-400' : 'text-white'}`}>
              {incidents.length}
            </span>
            <span className="text-xs text-slate-400">anomalies flagged</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono">
            Continuous telemetry evaluation
          </div>
        </div>
      </div>

      {/* Main Operations Grid: Map + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View (2 columns) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm flex flex-col h-[560px]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Live Logistics Geospatial Stream</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                PostGIS 3.4
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">🏭 {warehouses.length} Hubs</span>
              <span className="flex items-center gap-1">⚡ {stations.length} Grid Chargers</span>
              <span className="flex items-center gap-1">🚚 {assets.length} Vehicles</span>
            </div>
          </div>
          <div className="flex-1 relative">
            <LiveFleetMap
              assets={assets}
              warehouses={warehouses}
              stations={stations}
              selectedAssetId={selectedAsset?.id}
              onSelectAsset={setSelectedAsset}
            />
          </div>
        </div>

        {/* Telemetry Inspection & Vehicle Feed (1 column) */}
        <div className="space-y-4">
          {/* Selected Asset Telemetry HUD */}
          {selectedAsset ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedAsset.code}
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-slate-800 text-slate-300">
                      {selectedAsset.type}
                    </span>
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400">VIN: {selectedAsset.vin}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedAsset.status === 'EN_ROUTE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : selectedAsset.status === 'CHARGING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                }`}>
                  {selectedAsset.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">CURRENT SPEED</span>
                  <span className="text-white font-mono font-bold text-base">
                    {selectedAsset.currentSpeedKmh.toFixed(1)} km/h
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">BATTERY PACK</span>
                  <span className="text-emerald-400 font-mono font-bold text-base">
                    {selectedAsset.currentBatteryPercent}%
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">PAYLOAD CAPACITY</span>
                  <span className="text-white font-mono font-bold">
                    {selectedAsset.maxPayloadKg} kg
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ENERGY CAPACITY</span>
                  <span className="text-white font-mono font-bold">
                    {selectedAsset.batteryCapacityKwh} kWh
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>GPS Lat:</span>
                  <span className="text-white">{selectedAsset.currentLatitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GPS Lng:</span>
                  <span className="text-white">{selectedAsset.currentLongitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telemetry Heartbeat:</span>
                  <span className="text-emerald-400">Live (STOMP / Redis)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-slate-500 text-xs">
              Select an asset on the map to inspect live telemetry.
            </div>
          )}

          {/* Active Incidents Ticker */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Operational Incident Feed</span>
              <span className="text-amber-400">{incidents.length} active</span>
            </h3>

            {incidents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No active anomalies detected. Operations nominal.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {incidents.map(inc => (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between font-semibold text-white">
                        <span>{inc.type}</span>
                        <span className="text-[10px] text-amber-400 font-mono">{inc.severity}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">{inc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
