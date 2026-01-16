
import React from 'react';
import type { Vehicle, User } from '../types';
import { ICONS } from '../constants';

interface OperadorDashboardProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  user: User;
}

const OperadorDashboard: React.FC<OperadorDashboardProps> = ({ vehicles, onSelectVehicle, user }) => {
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const overdueVehicles = vehicles.filter(v => {
    if (!v.lastCheckDate) return true;
    const lastCheckTime = new Date(v.lastCheckDate).getTime();
    return (now - lastCheckTime) > sevenDaysInMs;
  });

  const recentlyChecked = vehicles.filter(v => {
    if (!v.lastCheckDate) return false;
    const lastCheckTime = new Date(v.lastCheckDate).getTime();
    return (now - lastCheckTime) <= sevenDaysInMs;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Hola, {user.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 font-medium">Panel de control de flota Paviotti.</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-10 h-10" />
        </div>
      </header>

      {/* Acciones Rápidas */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onSelectVehicle(vehicles[0]?.id)}
            className="flex items-center gap-4 p-6 bg-amber-50 border-2 border-amber-100 rounded-3xl hover:bg-amber-100 transition-all text-left"
          >
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <ICONS.Fuel className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 uppercase">Cargar Combustible</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase">Registrar litros y ticket</p>
            </div>
          </button>
          <button
            onClick={() => onSelectVehicle(overdueVehicles[0]?.id || vehicles[0]?.id)}
            className="flex items-center gap-4 p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl hover:bg-blue-100 transition-all text-left"
          >
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <ICONS.Check className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-black text-blue-900 uppercase">Realizar Checklist</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase">Control de fluidos y estado</p>
            </div>
          </button>
        </div>
      </section>

      {/* Vehículos con Control Pendiente */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            Controles Pendientes
          </h3>
          <span className="text-xs font-bold text-slate-400">{overdueVehicles.length} Unidades</span>
        </div>

        {overdueVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {overdueVehicles.map(v => (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(v.id)}
                className="group relative bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all overflow-hidden cursor-pointer"
              >
                <div className="aspect-video bg-slate-100 relative">
                  {v.photos.length > 0 ? (
                    <img src={v.photos[v.mainPhotoIndex]} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" alt={v.plate} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ICONS.Car className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-6">
                    <p className="text-white text-2xl font-black tracking-tighter">{v.plate}</p>
                    <p className="text-white/70 text-xs font-bold uppercase">{v.brand} {v.model}</p>
                  </div>
                </div>
                <div className="p-6 bg-red-50/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-red-600 uppercase">Estado</p>
                      <p className="text-sm font-black text-slate-900 uppercase">Sin control reciente</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 bg-emerald-50 rounded-[2.5rem] border-2 border-dashed border-emerald-100 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-200">
              <ICONS.Check className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-emerald-900 mb-2">¡Todo al día!</h4>
            <p className="text-emerald-600 font-medium text-sm">No hay vehículos con controles vencidos.</p>
          </div>
        )}
      </section>

      {/* Vehículos al día */}
      {recentlyChecked.length > 0 && (
        <section className="pt-8 border-t border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Unidades al día</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentlyChecked.map(v => (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(v.id)}
                className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100">
                  {v.photos.length > 0 ? (
                    <img src={v.photos[v.mainPhotoIndex]} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <ICONS.Car className="w-full h-full p-2 text-slate-300" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-slate-900 truncate">{v.plate}</p>
                  <p className="text-[9px] text-emerald-500 font-bold">OK</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default OperadorDashboard;
