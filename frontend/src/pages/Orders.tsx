import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Order, DispatchAssignment } from '../types';
import {
  PackageCheck,
  Plus,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Leaf,
  MapPin
} from 'lucide-react';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchAssignment | null>(null);

  const [newOrder, setNewOrder] = useState({
    orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    destinationAddress: '770 Broadway, New York, NY 10003',
    destinationLatitude: 40.7291,
    destinationLongitude: -73.9912,
    weightKg: 45.5,
    volumeM3: 0.85
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Order[]>('/orders');
      setOrders(res.data);
    } catch (err: any) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/orders', newOrder);
      setIsCreateModalOpen(false);
      setNewOrder({
        orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        destinationAddress: '150 5th Ave, New York, NY 10011',
        destinationLatitude: 40.7401,
        destinationLongitude: -73.9904,
        weightKg: 28.0,
        volumeM3: 0.4
      });
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create order');
    }
  };

  const handleDispatch = async (orderId: string) => {
    try {
      setDispatchResult(null);
      const res = await apiClient.post<DispatchAssignment>(`/dispatch/orders/${orderId}`);
      setDispatchResult(res.data);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Dispatch failed - check vehicle battery or capacity constraints');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <PackageCheck className="w-7 h-7 text-emerald-400" />
            Orders &amp; Multi-Objective Dispatch Solver
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pareto-optimal delivery assignment balancing carbon emissions, SLA delivery deadlines, and EV range constraints.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Create Delivery Order
          </button>
        </div>
      </div>

      {/* Dispatch Notification Alert */}
      {dispatchResult && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="font-semibold text-white text-sm">
                Pareto Dispatch Optimization Successful!
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">
                Assigned Asset: <span className="text-emerald-400 font-bold">{dispatchResult.assetId}</span> | Efficiency Score:{' '}
                <span className="text-white font-bold">{dispatchResult.efficiencyScore?.toFixed(2)}</span> | Estimated CO₂ Avoided:{' '}
                <span className="text-emerald-400 font-bold">{dispatchResult.co2SavingsGrams?.toFixed(0)}g</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDispatchResult(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-base font-semibold text-white">Consignment Fulfillment Queue</h2>
          <span className="text-xs font-mono text-slate-400">{orders.length} Total Consignments</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No orders submitted. Create a new delivery order to trigger autonomous dispatch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/40 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Order Number</th>
                  <th className="px-6 py-3.5">Destination</th>
                  <th className="px-6 py-3.5">Cargo Specs</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Assigned Asset</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono text-xs text-emerald-400 font-semibold">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-white">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {order.destinationAddress}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        GPS: {order.destinationLatitude?.toFixed(4)}, {order.destinationLongitude?.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <div>Weight: <span className="text-white font-medium">{order.weightKg} kg</span></div>
                      <div>Volume: <span className="text-slate-400">{order.volumeM3} m³</span></div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : order.status === 'DISPATCHED' || order.status === 'IN_TRANSIT'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-300">
                      {order.assignedAssetId || 'UNASSIGNED'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === 'SUBMITTED' || order.status === 'INVENTORY_RESERVED' ? (
                        <button
                          onClick={() => handleDispatch(order.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
                        >
                          <Send className="w-3 h-3" />
                          Solve Dispatch
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">Dispatched</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Create Consignment Order</h3>
            <p className="text-slate-400 text-xs mb-4">
              Enter customer destination coordinates and cargo dimensions for autonomous carbon routing.
            </p>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Order Number</label>
                <input
                  type="text"
                  value={newOrder.orderNumber}
                  onChange={e => setNewOrder({ ...newOrder, orderNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Destination Address</label>
                <input
                  type="text"
                  value={newOrder.destinationAddress}
                  onChange={e => setNewOrder({ ...newOrder, destinationAddress: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newOrder.destinationLatitude}
                    onChange={e => setNewOrder({ ...newOrder, destinationLatitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newOrder.destinationLongitude}
                    onChange={e => setNewOrder({ ...newOrder, destinationLongitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOrder.weightKg}
                    onChange={e => setNewOrder({ ...newOrder, weightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Volume (m³)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOrder.volumeM3}
                    onChange={e => setNewOrder({ ...newOrder, volumeM3: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-500/20"
                >
                  Confirm Consignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
