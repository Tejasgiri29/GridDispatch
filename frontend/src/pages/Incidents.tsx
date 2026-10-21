import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Incident } from '../types';
import { AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw, Clock, Filter } from 'lucide-react';

export const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Incident[]>('/incidents');
      setIncidents(res.data);
    } catch (err: any) {
      console.error('Failed to load incidents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.put(`/incidents/${id}/status?status=${newStatus}`);
      fetchIncidents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update incident status');
    }
  };

  const filtered = statusFilter === 'ALL'
    ? incidents
    : incidents.filter(i => i.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
            Telemetry Anomaly &amp; Safety Incidents
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time sliding window outlier detection: battery cell degradation, geofence breaches, and temperature violations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-medium">
        {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`pb-3 border-b-2 transition ${
              statusFilter === tab
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 animate-pulse">Loading incidents...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 font-mono text-xs">
          No anomalies recorded in this view. Fleet telemetry operations nominal.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inc => (
            <div
              key={inc.id}
              className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                inc.status === 'RESOLVED'
                  ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                  : inc.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  inc.status === 'RESOLVED'
                    ? 'text-slate-500'
                    : inc.severity === 'CRITICAL'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{inc.type}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Asset: {inc.assetId}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{inc.description}</p>
                  <span className="text-[10px] font-mono text-slate-500 block mt-1">
                    Detected: {new Date(inc.detectedAt).toLocaleString()}
                    {inc.resolvedAt && ` | Resolved: ${new Date(inc.resolvedAt).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {inc.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleUpdateStatus(inc.id, 'ACKNOWLEDGED')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    Acknowledge
                  </button>
                )}
                {inc.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(inc.id, 'RESOLVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve Alert
                  </button>
                )}
                {inc.status === 'RESOLVED' && (
                  <span className="text-xs text-emerald-400 font-mono font-medium">
                    Resolved &amp; Closed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
