import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Asset, TelemetryEvent } from '../types';
import { PlayCircle, PauseCircle, RotateCcw, FastForward, Clock, Cpu, Battery, Gauge } from 'lucide-react';

export const Replay: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get<Asset[]>('/fleet').then(res => {
      setAssets(res.data);
      if (res.data.length > 0) {
        setSelectedAssetId(res.data[0].id);
      }
    });
  }, []);

  const fetchHistory = async () => {
    if (!selectedAssetId) return;
    try {
      setLoading(true);
      setIsPlaying(false);
      const res = await apiClient.get<TelemetryEvent[]>(`/replay/assets/${selectedAssetId}`);
      if (res.data.length > 0) {
        setTelemetryHistory(res.data);
        setCurrentIndex(0);
      } else {
        // Generate simulated trajectory frames if backend has only seed frames
        const simulatedFrames: TelemetryEvent[] = Array.from({ length: 40 }).map((_, i) => ({
          id: `frame-${i}`,
          assetId: selectedAssetId,
          latitude: 40.7128 + i * 0.0015,
          longitude: -74.0060 + i * 0.0012,
          speedKmh: Math.max(15, Math.min(65, 35 + Math.sin(i / 3) * 20)),
          batteryPercent: Math.max(20, Math.round(92 - i * 0.8)),
          energyConsumptionKw: 18.5 + Math.cos(i) * 4,
          ambientTemperatureC: 21.5,
          timestamp: new Date(Date.now() - (40 - i) * 60000).toISOString()
        }));
        setTelemetryHistory(simulatedFrames);
        setCurrentIndex(0);
      }
    } catch (err: any) {
      console.error('Failed to load replay events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedAssetId]);

  // Playback timer loop
  useEffect(() => {
    let interval: any;
    if (isPlaying && telemetryHistory.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= telemetryHistory.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speedMultiplier);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, telemetryHistory.length]);

  const currentFrame = telemetryHistory[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <PlayCircle className="w-7 h-7 text-emerald-400" />
            Digital Twin Historical Telemetry Replay
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Frame-by-frame temporal replay of autonomous vehicle sensors, powertrain draw, and route corridors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedAssetId}
            onChange={e => setSelectedAssetId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
          >
            {assets.map(a => (
              <option key={a.id} value={a.id}>
                {a.code} ({a.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Control Deck */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm space-y-6">
        {/* Scrubber Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Frame {currentIndex + 1} of {telemetryHistory.length || 1}</span>
            <span className="text-white">
              {currentFrame ? new Date(currentFrame.timestamp).toLocaleTimeString() : '00:00:00'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, telemetryHistory.length - 1)}
            value={currentIndex}
            onChange={e => setCurrentIndex(parseInt(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
            >
              {isPlaying ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              {isPlaying ? 'Pause Replay' : 'Play Trajectory'}
            </button>
            <button
              onClick={() => { setCurrentIndex(0); setIsPlaying(false); }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">Speed:</span>
            {[1, 2, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2.5 py-1 rounded font-mono font-semibold transition ${
                  speedMultiplier === s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Telemetry Frame State Cards */}
      {currentFrame && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ground Speed</span>
              <Gauge className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-bold font-mono text-white">
              {currentFrame.speedKmh?.toFixed(1)} <span className="text-sm font-normal text-slate-400">km/h</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 font-mono">GPS Doppler Velocity</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Battery Pack SOC</span>
              <Battery className="w-5 h-5 text-sky-400" />
            </div>
            <div className="mt-3 text-3xl font-bold font-mono text-sky-400">
              {currentFrame.batteryPercent}%
            </div>
            <div className="mt-1 text-xs text-slate-500 font-mono">Pack Degradation Nominal</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Power Demand</span>
              <Cpu className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-3 text-3xl font-bold font-mono text-amber-400">
              {currentFrame.energyConsumptionKw?.toFixed(1)} <span className="text-sm font-normal text-slate-400">kW</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 font-mono">Real-time Inverter Draw</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Geospatial Fix</span>
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="mt-3 text-sm font-bold font-mono text-white">
              {currentFrame.latitude?.toFixed(5)}, {currentFrame.longitude?.toFixed(5)}
            </div>
            <div className="mt-1 text-xs text-slate-500 font-mono">PostGIS WGS84 point</div>
          </div>
        </div>
      )}
    </div>
  );
};
