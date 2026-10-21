import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Asset } from '../types';
import { Truck, Battery, Plus, RefreshCw, Zap, Shield, Search } from 'lucide-react';

export const Fleet: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newAsset, setNewAsset] = useState({
    code: 'EV-VAN-' + Math.floor(100 + Math.random() * 900),
    vin: '1FTFW1ED4NFA' + Math.floor(10000 + Math.random() * 90000),
    type: 'EV_VAN',
    status: 'IDLE',
    maxPayloadKg: 1250,
    batteryCapacityKwh: 85,
    currentBatteryPercent: 95,
    currentLatitude: 40.7128,
    currentLongitude: -74.0060,
    currentSpeedKmh: 0
  });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Asset[]>('/fleet');
      setAssets(res.data);
    } catch (err: any) {
      console.error('Failed to load fleet assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/fleet', newAsset);
      setIsModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to onboard asset');
    }
  };

  const handleStatusUpdate = async (asset: Asset, newStatus: string) => {
    try {
      await apiClient.put(`/fleet/${asset.id}/status?status=${newStatus}`);
      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update vehicle status');
    }
  };

  const filteredAssets = typeFilter === 'ALL'
    ? assets
    : assets.filter(a => a.type === typeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-400" />
            Autonomous Fleet &amp; Vehicle Telemetry
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time battery state-of-health, zero-emission powertrain telemetry, and payload envelope tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssets}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Onboard Asset
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
        {['ALL', 'EV_VAN', 'ELECTRIC_SEMI', 'AUTONOMOUS_DRONE', 'CARGO_EBIKE'].map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              typeFilter === type
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 animate-pulse">Loading fleet assets...</div>
      ) : filteredAssets.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
          No vehicles registered for this category filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map(asset => {
            const batteryColor =
              asset.currentBatteryPercent > 60
                ? 'text-emerald-400 bg-emerald-500'
                : asset.currentBatteryPercent > 25
                ? 'text-amber-400 bg-amber-500'
                : 'text-rose-400 bg-rose-500';

            return (
              <div
                key={asset.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{asset.code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300">
                        {asset.type}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">VIN: {asset.vin}</div>
                  </div>
                  <select
                    value={asset.status}
                    onChange={e => handleStatusUpdate(asset, e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-semibold focus:outline-none"
                  >
                    <option value="IDLE">IDLE</option>
                    <option value="EN_ROUTE">EN_ROUTE</option>
                    <option value="CHARGING">CHARGING</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>

                {/* Battery Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5" /> State of Charge
                    </span>
                    <span className={`font-bold ${batteryColor.split(' ')[0]}`}>
                      {asset.currentBatteryPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full ${batteryColor.split(' ')[1]}`}
                      style={{ width: `${asset.currentBatteryPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Telemetry metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono">
                    <span className="text-[10px] text-slate-400 block">SPEED</span>
                    <span className="text-white font-bold">{asset.currentSpeedKmh.toFixed(1)} km/h</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono">
                    <span className="text-[10px] text-slate-400 block">MAX PAYLOAD</span>
                    <span className="text-white font-bold">{asset.maxPayloadKg} kg</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/60 flex justify-between">
                  <span>GPS: {asset.currentLatitude.toFixed(4)}, {asset.currentLongitude.toFixed(4)}</span>
                  <span className="text-emerald-400">Telemetry Active</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Onboard Fleet Vehicle</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Code</label>
                <input
                  type="text"
                  value={newAsset.code}
                  onChange={e => setNewAsset({ ...newAsset, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle VIN</label>
                <input
                  type="text"
                  value={newAsset.vin}
                  onChange={e => setNewAsset({ ...newAsset, vin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={newAsset.type}
                    onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="EV_VAN">EV_VAN</option>
                    <option value="ELECTRIC_SEMI">ELECTRIC_SEMI</option>
                    <option value="AUTONOMOUS_DRONE">AUTONOMOUS_DRONE</option>
                    <option value="CARGO_EBIKE">CARGO_EBIKE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Battery (kWh)</label>
                  <input
                    type="number"
                    value={newAsset.batteryCapacityKwh}
                    onChange={e => setNewAsset({ ...newAsset, batteryCapacityKwh: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-500/20"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
