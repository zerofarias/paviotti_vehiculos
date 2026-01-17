

import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, CheckType } from './types';
import type { User, Vehicle, CheckLog, MaintenanceConfig } from './types';
import { ICONS } from './constants';
import Dashboard from './pages/Dashboard';
import OperadorDashboard from './pages/OperadorDashboard';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import Settings from './pages/Settings';
import FuelAnalytics from './pages/FuelAnalytics';
import Reports from './pages/Reports';
import UsersPage from './pages/Users';
import Login from './pages/Login';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { useAuth } from './contexts/AuthContext';
import { apiGet, apiPost, apiPut } from './utils/api';

const App: React.FC = () => {
  // ==========================================
  // TODOS LOS HOOKS AL INICIO (Rules of Hooks)
  // ==========================================

  // Auth
  const { user: authUser, isAuthenticated, isLoading: authLoading, logout, accessToken } = useAuth();

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'vehicles' | 'fuel' | 'reports' | 'users' | 'settings'>('dashboard');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<CheckLog[]>([]);

  const [config, setConfig] = useState<MaintenanceConfig>({
    serviceKmInterval: 10000,
    serviceMonthInterval: 6,
    tireChangeKmInterval: 40000,
    checkIntervalDays: 7,
    notificationEmail: 'gerencia@paviotti.com',
    enableEmailAlerts: true,
    alertOnService: true,
    alertOnLicense: true,
    alertOnFireExtinguisher: true,
    smtpServer: 'smtp.paviotti.com',
    smtpUser: 'alertas@paviotti.com'
  });

  // Fetch Vehicles, Logs, and Config
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, lRes, uRes, cRes] = await Promise.all([
          apiGet('/api/vehicles'),
          apiGet('/api/logs'),
          apiGet('/api/users'),
          apiGet('/api/config')
        ]);
        if (vRes.ok) setVehicles(await vRes.json());
        if (lRes.ok) setLogs(await lRes.json());
        if (cRes.ok) {
          const remoteConfig = await cRes.json();
          // Merge remote config with defaults to ensure all fields exist
          setConfig(prev => ({ ...prev, ...remoteConfig }));
        }
        if (uRes.ok) {
          const usersData = await uRes.json();
          setUsers(usersData);
          // Set current user from auth
          if (authUser) {
            setCurrentUser(authUser);
          }
        }
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authUser]);

  const vehiclesNeedingService = useMemo(() => {
    return vehicles.filter(v => {
      const kmSinceService = v.currentMileage - v.lastServiceMileage;
      const dateLast = v.lastServiceDate ? new Date(v.lastServiceDate) : new Date();
      const monthsSinceService = (new Date().getTime() - dateLast.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      return kmSinceService >= config.serviceKmInterval || monthsSinceService >= config.serviceMonthInterval;
    }).length;
  }, [vehicles, config]);

  // ==========================================
  // CONDITIONAL RETURNS DESPUÉS DE LOS HOOKS
  // ==========================================

  // Si está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Si no hay currentUser, loading
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const handleAddLog = async (log: Omit<CheckLog, 'id'>) => {
    try {
      const response = await apiPost('/api/logs', log);

      if (response.ok) {
        const savedLog = await response.json();
        setLogs(prev => [savedLog, ...prev]);

        // Show success toast
        const logTypeLabel = log.type === CheckType.WEEKLY_SAFETY ? 'Control' : log.type === CheckType.SERVICE ? 'Service' : 'Combustible';
        showSuccess(`${logTypeLabel} registrado exitosamente`);

        // Also update Vehicle locally to reflect changes immediately (e.g. mileage)
        // Ideally we should refetch vehicle or return updated vehicle from API, 
        // but for now we trust the logic in VehicleDetail passed to handleUpdateVehicle
        // Wait, VehicleDetail calls handleAddLog AND handleUpdateVehicle.
        // So we don't need to update vehicle here, handleUpdateVehicle will do it.
      } else {
        showError('Error al guardar el registro');
      }
    } catch (error) {
      console.error("Error creating log", error);
      showError('Error de conexión al guardar');
    }
  };

  const handleAddVehicle = async (vehicleData: Partial<Vehicle>) => {
    // Add default values for required fields that might be missing in Partial
    const fullVehicleData = {
      ...vehicleData,
      status: 'active',
      lastServiceMileage: 0,
      lastServiceDate: new Date().toISOString(),
      damagePoints: vehicleData.damagePoints || [],
      inventory: vehicleData.inventory || [],
      fuelLogs: vehicleData.fuelLogs || [],
      photos: vehicleData.photos || []
    };

    console.log('Sending Vehicle Data to API:', fullVehicleData);

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullVehicleData)
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('Server responded with error:', errData);
        throw new Error(errData.details || 'Failed to create vehicle');
      }

      const newVehicle = await res.json();
      setVehicles([...vehicles, newVehicle]);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('Error al crear vehículo. Revisa la consola para más detalles.');
    }
  };

  const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
    try {
      const response = await apiPut(`/api/vehicles/${updatedVehicle.id}`, updatedVehicle);

      if (response.ok) {
        const saved = await response.json();
        setVehicles(prev => prev.map(v => v.id === saved.id ? saved : v));
        showSuccess('Vehículo actualizado correctamente');
      } else {
        showError('Error al actualizar el vehículo');
      }
    } catch (error) {
      console.error("Error updating vehicle", error);
      showError('Error de conexión al actualizar');
    }
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const NavItem: React.FC<{ tab: typeof currentTab; icon: React.ComponentType<{ className?: string }>; label: string }> = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => { setCurrentTab(tab); setSelectedVehicleId(null); }}
      className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${currentTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
        }`}
    >
      <Icon className={`w-5 h-5 transition-transform ${currentTab === tab ? 'scale-110' : ''}`} />
      <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-64 flex flex-col transition-colors overflow-x-hidden">
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white p-6 z-40">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-900/40">
            <ICONS.Car className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Paviotti</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <button onClick={() => { setCurrentTab('dashboard'); setSelectedVehicleId(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'hover:bg-slate-800 text-slate-400'}`}>
            <ICONS.Dashboard className="w-5 h-5" />
            <span className="font-bold uppercase text-xs tracking-widest">{isAdmin ? 'Dashboard' : 'Tareas'}</span>
          </button>
          <button onClick={() => { setCurrentTab('vehicles'); setSelectedVehicleId(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentTab === 'vehicles' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'hover:bg-slate-800 text-slate-400'}`}>
            <ICONS.Car className="w-5 h-5" />
            <span className="font-bold uppercase text-xs tracking-widest">Flota</span>
          </button>

          {isAdmin && (
            <button onClick={() => { setCurrentTab('fuel'); setSelectedVehicleId(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentTab === 'fuel' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'hover:bg-slate-800 text-slate-400'}`}>
              <ICONS.Fuel className="w-5 h-5" />
              <span className="font-bold uppercase text-xs tracking-widest">Combustible</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button onClick={() => { setCurrentTab('reports'); setSelectedVehicleId(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentTab === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'hover:bg-slate-800 text-slate-400'}`}>
                <ICONS.Chart className="w-5 h-5" />
                <span className="font-bold uppercase text-xs tracking-widest">Reportes</span>
              </button>
              <button onClick={() => { setCurrentTab('users'); setSelectedVehicleId(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'hover:bg-slate-800 text-slate-400'}`}>
                <ICONS.Users className="w-5 h-5" />
                <span className="font-bold uppercase text-xs tracking-widest">Personal</span>
              </button>
              <button onClick={() => { setCurrentTab('settings'); setSelectedVehicleId(null); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${currentTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'hover:bg-slate-800 text-slate-400'}`}>
                <ICONS.Settings className="w-5 h-5" />
                <span className="font-bold uppercase text-xs tracking-widest">Config</span>
              </button>
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
          <div className="bg-slate-800/50 p-2 rounded-xl">
            <select
              className="w-full bg-transparent text-[10px] font-bold uppercase outline-none text-slate-400"
              onChange={(e) => {
                setCurrentUser(users.find(u => u.id === e.target.value)!);
                setCurrentTab('dashboard');
                setSelectedVehicleId(null);
              }}
              value={currentUser.id}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                logout();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-bold uppercase text-xs shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-3 sm:p-4 md:p-10 w-full max-w-full overflow-x-hidden">
        {selectedVehicleId ? (
          <VehicleDetail
            vehicle={vehicles.find(v => v.id === selectedVehicleId)!}
            logs={logs.filter(l => l.vehicleId === selectedVehicleId)}
            config={config}
            onBack={() => setSelectedVehicleId(null)}
            onAddLog={handleAddLog}
            currentUser={currentUser}
            onUpdateVehicle={handleUpdateVehicle}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              isAdmin ? (
                <Dashboard
                  vehicles={vehicles}
                  logs={logs}
                  stats={{
                    totalVehicles: vehicles.length,
                    needingService: vehiclesNeedingService,
                    totalCheckupsToday: logs.filter(l => l.timestamp.split('T')[0] === new Date().toISOString().split('T')[0]).length
                  }}
                  onSelectVehicle={setSelectedVehicleId}
                  users={users}
                  config={config}
                />
              ) : (
                <OperadorDashboard
                  vehicles={vehicles}
                  onSelectVehicle={setSelectedVehicleId}
                  user={currentUser}
                />
              )
            )}
            {currentTab === 'vehicles' && (
              <VehicleList
                vehicles={vehicles}
                onSelectVehicle={setSelectedVehicleId}
                config={config}
                onAddVehicle={handleAddVehicle}
                isAdmin={isAdmin}
              />
            )}
            {currentTab === 'fuel' && isAdmin && (
              <FuelAnalytics vehicles={vehicles} logs={logs} />
            )}
            {isAdmin && (
              <>
                {currentTab === 'reports' && <Reports vehicles={vehicles} logs={logs} />}
                {currentTab === 'users' && isAdmin && (
                  <UsersPage />
                )}        {currentTab === 'settings' && <Settings config={config} setConfig={setConfig} user={currentUser} />}
              </>
            )}
          </>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center z-[100] pb-safe-area h-20 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
        <NavItem tab="dashboard" icon={ICONS.Dashboard} label={isAdmin ? "Inicio" : "Tareas"} />
        <NavItem tab="vehicles" icon={ICONS.Car} label="Flota" />
        {isAdmin && <NavItem tab="reports" icon={ICONS.Chart} label="Reportes" />}
        {isAdmin && <NavItem tab="users" icon={ICONS.Users} label="Staff" />}
        {isAdmin && <NavItem tab="settings" icon={ICONS.Settings} label="Ajustes" />}
      </nav>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default App;
