import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ChargingStation, ChargingSchedule, Asset } from '../types';
import { BatteryCharging, Zap, Plus, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const EnergyCharging: React.FC = () => {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [schedules, setSchedules] = useState<ChargingSchedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    assetId: '',
    stationId: '',
    scheduledStartTime: new Date().toISOString(),
    scheduledEndTime: new Date(Date.now() + 3600000 * 2).toISOString(),
    energyAmountKwh: 45.0,
    estimatedCost: 12.50
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, scRes, asRes] = await Promise.all([
        apiClient.get<ChargingStation[]>('/charging/stations'),
        apiClient.get<ChargingSchedule[]>('/charging/schedules'),
        apiClient.get<Asset[]>('/fleet')
      ]);
      setStations(stRes.data);
      setSchedules(scRes.data);
      setAssets(asRes.data);
      if (asRes.data.length > 0 && stRes.data.length > 0 && !newSchedule.assetId) {
        setNewSchedule(prev => ({
          ...prev,
          assetId: asRes.data[0].id,
          stationId: stRes.data[0].id
        }));
      }
    } catch (err: any) {
      console.error('Failed to load charging data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/charging/schedules', newSchedule);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to schedule charging session');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BatteryCharging className="w-7 h-7 text-emerald-400" />
            Carbon-Aware Smart EV Charging Scheduler
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Autonomous fleet charging orchestration timed to match peak solar &amp; wind grid curtailment intervals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
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
            Schedule Smart Charge
          </button>
        </div>
      </div>

      {/* Grid Carbon Intensity Forecast Spectrum */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">24-Hour Regional Grid Carbon Intensity Forecast</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            OPTIMAL CHARGE WINDOW: 01:00 - 05:00 UTC (110 gCO₂/kWh)
          </span>
        </div>

        {/* Forecast Bars */}
        <div className="grid grid-cols-12 gap-1.5 pt-2">
          {[
            { hour: '00:00', intensity: 130, clean: true },
            { hour: '02:00', intensity: 110, clean: true },
            { hour: '04:00', intensity: 115, clean: true },
            { hour: '06:00', intensity: 220, clean: false },
            { hour: '08:00', intensity: 310, clean: false },
            { hour: '10:00', intensity: 280, clean: false },
            { hour: '12:00', intensity: 140, clean: true },
            { hour: '14:00', intensity: 125, clean: true },
            { hour: '16:00', intensity: 240, clean: false },
            { hour: '18:00', intensity: 360, clean: false },
            { hour: '20:00', intensity: 290, clean: false },
            { hour: '22:00', intensity: 180, clean: true }
          ].map((slot, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-16 w-full bg-slate-950 rounded flex items-end p-1 border border-slate-800">
                <div
                  className={`w-full rounded-sm transition-all ${
                    slot.clean ? 'bg-emerald-500' : 'bg-amber-500/80'
                  }`}
                  style={{ height: `${(slot.intensity / 380) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{slot.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charging Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stations.map(station => (
          <div key={station.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-base">{station.name}</h3>
                <span className="text-xs font-mono text-emerald-400">{station.code}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {station.availablePlugs} / {station.totalPlugs} Plugs Free
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-400 block">CHARGER POWER</span>
                <span className="text-white font-bold">{station.powerRatingKw} kW DC</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-400 block">GRID INTENSITY</span>
                <span className="text-emerald-400 font-bold">{station.gridCarbonIntensityGco2Kwh} gCO₂</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
              GPS: {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
            </div>
          </div>
        ))}
      </div>

      {/* Active Schedules Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">Active &amp; Queued Charging Allocations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/40 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Schedule ID</th>
                <th className="px-6 py-3.5">Asset</th>
                <th className="px-6 py-3.5">Charging Station</th>
                <th className="px-6 py-3.5">Scheduled Window</th>
                <th className="px-6 py-3.5">Energy Target</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {schedules.map(sc => (
                <tr key={sc.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-mono text-xs text-indigo-300 font-medium">
                    {sc.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-white">
                    {sc.assetId}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">
                    {sc.stationId}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(sc.scheduledStartTime).toLocaleTimeString()} - {new Date(sc.scheduledEndTime).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-white font-semibold">
                    {sc.energyAmountKwh} kWh
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {sc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Schedule Smart EV Charge</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle Asset</label>
                <select
                  value={newSchedule.assetId}
                  onChange={e => setNewSchedule({ ...newSchedule, assetId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code} ({a.type} - {a.currentBatteryPercent}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Charging Station</label>
                <select
                  value={newSchedule.stationId}
                  onChange={e => setNewSchedule({ ...newSchedule, stationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.powerRatingKw} kW - {s.availablePlugs} free)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Energy Required (kWh)</label>
                <input
                  type="number"
                  value={newSchedule.energyAmountKwh}
                  onChange={e => setNewSchedule({ ...newSchedule, energyAmountKwh: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
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
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
