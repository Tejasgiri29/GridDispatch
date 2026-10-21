import React from 'react';
import { Building2, Zap, Shield, Bell } from 'lucide-react';

interface NavbarProps {
  currentTenant: string;
  onTenantChange: (tenant: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTenant, onTenantChange }) => {
  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-20">
      {/* Left: Tenant selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <select
            value={currentTenant}
            onChange={(e) => onTenantChange(e.target.value)}
            className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="tenant-grid-us-east" className="bg-slate-900 text-white">
              US-East Operations (New York / NJ)
            </option>
            <option value="tenant-grid-eu-central" className="bg-slate-900 text-white">
              EU-Central Operations (Frankfurt / NL)
            </option>
          </select>
        </div>

        {/* Live Carbon Grid Intensity Pill */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Grid Carbon Intensity:</span>
          <span className="font-mono font-bold text-emerald-400">184 gCO₂/kWh</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-semibold">
            GREEN CHARGE WINDOW
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dispatch Engine:</span>
          <span className="font-mono text-emerald-400 font-semibold">Pareto Optimal</span>
        </div>

        <button className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400">
            OP
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-white">Fleet Controller</div>
            <div className="text-[10px] text-slate-400">Autonomous Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
