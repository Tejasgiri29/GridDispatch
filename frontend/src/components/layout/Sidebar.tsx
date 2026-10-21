import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Globe2,
  Truck,
  PackageCheck,
  Boxes,
  BatteryCharging,
  Leaf,
  AlertTriangle,
  PlayCircle,
  Activity
} from 'lucide-react';

const navItems = [
  { name: 'Live Operations Map', path: '/', icon: Globe2 },
  { name: 'Fleet & Telemetry', path: '/fleet', icon: Truck },
  { name: 'Orders & Dispatch', path: '/orders', icon: PackageCheck },
  { name: 'Inventory & Stock', path: '/inventory', icon: Boxes },
  { name: 'Energy & Charging', path: '/energy', icon: BatteryCharging },
  { name: 'Carbon Accounting', path: '/emissions', icon: Leaf },
  { name: 'Incidents & Alerts', path: '/incidents', icon: AlertTriangle },
  { name: 'Digital Twin Replay', path: '/replay', icon: PlayCircle },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-base">GridDispatch</span>
            <span className="block text-[10px] font-mono text-emerald-400 font-semibold tracking-wider">
              CARBON LOGISTICS
            </span>
          </div>
        </div>

        {/* Nav list */}
        <nav className="p-4 space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer telemetry status */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">Telemetry Stream</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400">
            Kafka &amp; PostGIS Active
          </div>
        </div>
      </div>
    </aside>
  );
};
