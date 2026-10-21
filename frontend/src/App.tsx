import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LiveOperations } from './pages/LiveOperations';
import { Fleet } from './pages/Fleet';
import { Orders } from './pages/Orders';
import { Inventory } from './pages/Inventory';
import { EnergyCharging } from './pages/EnergyCharging';
import { Emissions } from './pages/Emissions';
import { Incidents } from './pages/Incidents';
import { Replay } from './pages/Replay';

export const App: React.FC = () => {
  const [tenantId, setTenantId] = useState(
    localStorage.getItem('griddispatch_tenant_id') || 'tenant-grid-us-east'
  );

  const handleTenantChange = (newTenant: string) => {
    localStorage.setItem('griddispatch_tenant_id', newTenant);
    setTenantId(newTenant);
    window.location.reload();
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar currentTenant={tenantId} onTenantChange={handleTenantChange} />

          {/* Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<LiveOperations />} />
                <Route path="/fleet" element={<Fleet />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/energy" element={<EnergyCharging />} />
                <Route path="/emissions" element={<Emissions />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/replay" element={<Replay />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};
