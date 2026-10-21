import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { InventoryItem, InventoryReservation, Warehouse } from '../types';
import { Boxes, ShieldCheck, Plus, RefreshCw, AlertCircle, Clock, Lock } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [reservations, setReservations] = useState<InventoryReservation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  const [reserveForm, setReserveForm] = useState({
    warehouseId: '',
    sku: 'SKU-BATTERY-PACK-M',
    orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    quantity: 2,
    ttlSeconds: 900
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, whRes, resRes] = await Promise.all([
        apiClient.get<InventoryItem[]>('/inventory'),
        apiClient.get<Warehouse[]>('/inventory/warehouses'),
        apiClient.get<InventoryReservation[]>('/inventory/reservations')
      ]);
      setItems(itemsRes.data);
      setWarehouses(whRes.data);
      setReservations(resRes.data);
      if (whRes.data.length > 0 && !reserveForm.warehouseId) {
        setReserveForm(prev => ({ ...prev, warehouseId: whRes.data[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/inventory/reserve', reserveForm);
      setIsReserveModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reserve inventory - zero-oversell guarantee prevented allocation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Boxes className="w-7 h-7 text-emerald-400" />
            Zero-Oversell Multi-Location Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pessimistic write locking, TTL reservation release sweeps, and real-time safety stock allocation.
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
            onClick={() => setIsReserveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition"
          >
            <Lock className="w-4 h-4" />
            Test Reserve Lock
          </button>
        </div>
      </div>

      {/* Zero Oversell Invariant Banner */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              Mathematical Concurrency Invariant: Available Quantity ≥ Reserved
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PESSIMISTIC_WRITE_LOCK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-concurrency e-commerce spikes cannot cause phantom inventory depletion or negative warehouse balances.
            </p>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-base font-semibold text-white">SKU Stock Balances across Fulfillment Centers</h2>
          <span className="text-xs font-mono text-slate-400">{items.length} SKUs Listed</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading warehouse stock...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/40 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Warehouse ID</th>
                  <th className="px-6 py-3.5">Available Stock</th>
                  <th className="px-6 py-3.5">Active Reservations</th>
                  <th className="px-6 py-3.5">Safety Stock</th>
                  <th className="px-6 py-3.5 text-right">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono text-xs text-emerald-400 font-bold">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {item.warehouseId}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-white">
                      {item.availableQuantity} units
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-amber-400">
                      {item.reservedQuantity} units
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {item.safetyStockLevel} units
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.availableQuantity > item.safetyStockLevel
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.availableQuantity > item.safetyStockLevel ? 'HEALTHY' : 'LOW STOCK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active TTL Reservations */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Active Ephemeral Reservations (Auto-Expiring TTL Sweeper)
        </h2>
        {reservations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-mono">
            No active uncommitted reservations. Locks released to available pool.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map(res => (
              <div key={res.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-white font-semibold">
                  <span>{res.sku}</span>
                  <span className="text-amber-400">{res.reservedQuantity} qty</span>
                </div>
                <div className="text-slate-400">Order: {res.orderId}</div>
                <div className="text-slate-500 text-[10px]">
                  Expires: {new Date(res.expiresAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Reservation Modal */}
      {isReserveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Test Pessimistic Reservation Lock</h3>
            <p className="text-slate-400 text-xs mb-4">
              Acquires a pessimistic write lock on the inventory row and creates an auto-releasing TTL hold.
            </p>
            <form onSubmit={handleReserve} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Fulfillment Warehouse</label>
                <select
                  value={reserveForm.warehouseId}
                  onChange={e => setReserveForm({ ...reserveForm, warehouseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">SKU</label>
                <input
                  type="text"
                  value={reserveForm.sku}
                  onChange={e => setReserveForm({ ...reserveForm, sku: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={reserveForm.quantity}
                    onChange={e => setReserveForm({ ...reserveForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">TTL Hold (seconds)</label>
                  <input
                    type="number"
                    value={reserveForm.ttlSeconds}
                    onChange={e => setReserveForm({ ...reserveForm, ttlSeconds: parseInt(e.target.value) || 900 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-500/20"
                >
                  Acquire Lock &amp; Reserve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
