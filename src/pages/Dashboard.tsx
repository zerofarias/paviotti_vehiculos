
import React, { useMemo } from 'react';
import { CheckType } from '../types';
import type { Vehicle, CheckLog, FleetStats, User, MaintenanceConfig } from '../types';
import { ICONS } from '../constants';

interface DashboardProps {
  vehicles: Vehicle[];
  logs: CheckLog[];
  stats: FleetStats;
  onSelectVehicle: (id: string) => void;
  users: User[];
  config: MaintenanceConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ vehicles, logs, stats, onSelectVehicle, users, config }) => {
  // --- Medallero de Empleados (Mes Actual) ---
  const leaderboard = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const counts: Record<string, { name: string, count: number }> = {};

    logs.filter(log => {
      const date = new Date(log.timestamp);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).forEach(log => {
      if (!counts[log.userId]) {
        counts[log.userId] = { name: log.userName, count: 0 };
      }
      counts[log.userId].count++;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [logs]);

  // --- Evolución de Kilometraje (Últimos 7 días) ---
  const kmEvolutionData = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return dates.map(date => {
      const dayLogs = logs.filter(l => l.timestamp.startsWith(date));
      const totalKm = dayLogs.length > 0
        ? dayLogs.reduce((acc, curr) => acc + curr.mileage, 0) / dayLogs.length
        : vehicles.reduce((acc, v) => acc + v.currentMileage, 0) / (vehicles.length || 1);
      return { date, value: totalKm };
    });
  }, [logs, vehicles]);

  // --- Consumo de Combustible (Últimos 30 días) ---
  const fuelStats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const relevantLogs = logs.filter(l => l.type === CheckType.FUEL && new Date(l.timestamp) > thirtyDaysAgo);
    const totalLiters = relevantLogs.reduce((acc, l) => acc + (l.details.fuelLiters || 0), 0);
    const totalCost = relevantLogs.reduce((acc, l) => acc + (l.details.fuelCost || 0), 0);

    return { totalLiters, totalCost, count: relevantLogs.length };
  }, [logs]);

  // --- Alertas Próximas ---
  const alerts = useMemo(() => {
    const items: { label: string, desc: string, type: 'service' | 'tire' | 'other', severity: 'high' | 'normal' }[] = [];

    vehicles.forEach(v => {
      // Alerta Service
      const kmSinceService = v.currentMileage - v.lastServiceMileage;
      if (kmSinceService > (config.serviceKmInterval || 10000) - 1000) {
        items.push({
          label: `Service: ${v.plate}`,
          desc: `Faltan ${Math.max(0, (config.serviceKmInterval || 10000) - kmSinceService)} KM`,
          type: 'service',
          severity: kmSinceService >= (config.serviceKmInterval || 10000) ? 'high' : 'normal'
        });
      }

      // Alerta Control Personal Vencido
      const daysSinceCheck = v.lastCheckDate
        ? Math.floor((new Date().getTime() - new Date(v.lastCheckDate).getTime()) / (1000 * 3600 * 24))
        : 999;

      if (daysSinceCheck >= (config.checkIntervalDays || 7)) {
        items.push({
          label: `Control: ${v.plate}`,
          desc: `Hace ${daysSinceCheck} días sin control`,
          type: 'other',
          severity: 'high' // Usaremos esto para pintar naranja
        });
      }
    });

    return items.slice(0, 10); // Aumentamos limite para ver mas alertas
  }, [vehicles, config]);

  const maxKm = Math.max(...kmEvolutionData.map(d => d.value), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard General</h2>
        <p className="text-slate-500 font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Control de Flota • Paviotti</p>
      </header>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          <ICONS.Car className="w-8 h-8 text-blue-500 mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades Totales</p>
          <p className="text-4xl font-black mt-1">{vehicles.length}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-lg transition-all">
          <ICONS.Alert className={`w-8 h-8 mb-4 ${stats.needingService > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendientes de Taller</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-4xl font-black">{stats.needingService}</p>
            {stats.needingService > 0 && <span className="text-xs font-bold text-red-500 uppercase">Atención</span>}
          </div>

          {stats.needingService > 0 && (
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {vehicles.filter(v => {
                const kmSince = v.currentMileage - v.lastServiceMileage;
                const dateLast = v.lastServiceDate ? new Date(v.lastServiceDate) : new Date();
                const monthsSince = (new Date().getTime() - dateLast.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                return kmSince >= 10000 || monthsSince >= 6;
              }).map(v => (
                <button
                  key={v.id}
                  onClick={() => onSelectVehicle(v.id)}
                  className="w-full text-left px-3 py-2 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-between group/btn transition-colors"
                >
                  <div>
                    <span className="block text-[10px] font-black text-red-600 uppercase">{v.plate}</span>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">{v.brand} {v.model}</span>
                  </div>
                  <svg className="w-4 h-4 text-red-400 -translate-x-2 opacity-0 group-hover/btn:translate-x-0 group-hover/btn:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <ICONS.Fuel className="w-8 h-8 text-amber-500 mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargas (30d)</p>
          <p className="text-4xl font-black mt-1">{fuelStats.count}</p>
        </div>

        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
          <ICONS.Check className="w-8 h-8 text-white/50 mb-4" />
          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Checks Semanales</p>
          <p className="text-4xl font-black mt-1">{logs.filter(l => l.type === CheckType.WEEKLY_SAFETY).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Gráfico de Kilometraje */}
        <section className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Evolución de Kilometraje</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">Promedio de flota últimos 7 días</p>
            </div>
          </div>

          <div className="h-64 w-full relative flex items-end justify-between px-2 gap-2">
            {kmEvolutionData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div
                  className="w-full bg-blue-500/10 border-t-4 border-blue-600 rounded-t-xl transition-all hover:bg-blue-600 hover:scale-x-105 origin-bottom"
                  style={{ height: `${(d.value / maxKm) * 100}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap transition-all z-10">
                    {Math.round(d.value).toLocaleString()} KM
                  </div>
                </div>
                <span className="text-[8px] font-black text-slate-400 mt-4 uppercase truncate w-full text-center">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 border-t pt-8">
            <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Gasto Combustible (Mes)</p>
              <p className="text-2xl font-black text-slate-900">${fuelStats.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Litros Consumidos</p>
              <p className="text-2xl font-black text-slate-900">{fuelStats.totalLiters.toLocaleString()} L</p>
            </div>
          </div>
        </section>

        {/* Medallero de Empleados */}
        <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl flex flex-col">
          <h3 className="text-lg font-black uppercase tracking-tight mb-8 flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            Medallero del Mes
          </h3>

          <div className="flex-1 space-y-4">
            {leaderboard.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 uppercase text-[10px] font-black tracking-widest">Sin actividad este mes</div>
            ) : (
              leaderboard.map((user, index) => (
                <div key={index} className={`flex items-center gap-4 p-5 rounded-2xl transition-all ${index === 0 ? 'bg-amber-500/20 border border-amber-500/30' :
                  index === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                    index === 2 ? 'bg-orange-900/20 border border-orange-900/30' : 'bg-white/5'
                  }`}>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shadow-inner bg-cover bg-center" style={{ backgroundImage: `url(${users.find(u => u.name === user.name)?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`})` }}>
                    </div>
                    {index < 3 && (
                      <div className={`absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-[12px] shadow-xl ring-4 ring-slate-900 ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-300 text-slate-900' : 'bg-orange-600'
                        }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-black uppercase tracking-tight ${index === 0 ? 'text-amber-500' : 'text-white'}`}>{user.name}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">{user.count} Controles realizados</p>
                  </div>
                  {index < 3 && <div className="text-[10px] font-black text-slate-400">{index + 1}º</div>}
                </div>
              ))
            )}
          </div>

          {leaderboard.length > 3 && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Otras menciones:</p>
              <div className="flex flex-wrap gap-2">
                {leaderboard.slice(3).map((u, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-slate-400">{u.name}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Alertas de Vencimiento */}
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-2">
            <ICONS.Alert className="w-6 h-6 text-red-500" />
            Alertas Críticas
          </h3>
          <div className="flex-1 space-y-4">
            {alerts.length === 0 ? (
              <div className="py-10 text-center bg-emerald-50 rounded-[2rem] border border-emerald-100">
                <ICONS.Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Flota en buen estado</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <div key={i} className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 group cursor-pointer hover:scale-[1.02] transition-all 
                  ${alert.type === 'other' ? 'bg-orange-50 border-orange-100' :
                    alert.severity === 'high' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                  <div className={`p-3 rounded-2xl 
                    ${alert.type === 'other' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' :
                      alert.severity === 'high' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-200 text-slate-500'
                    }`}>
                    {alert.type === 'service' ? <ICONS.Settings className="w-4 h-4" /> :
                      alert.type === 'other' ? <ICONS.Check className="w-4 h-4" /> :
                        <ICONS.Alert className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 uppercase">{alert.label}</p>
                    <p className={`text-[9px] font-bold uppercase 
                      ${alert.type === 'other' ? 'text-orange-600' :
                        alert.severity === 'high' ? 'text-red-600' : 'text-slate-400'}`}>
                      {alert.desc}
                    </p>
                  </div>
                  <ICONS.Car className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-colors">Ver Plan de Mantenimiento</button>
        </section>

        {/* Vista rápida de Unidades */}
        <section className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Estado de Unidades</h3>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver todas</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.slice(0, 4).map(v => (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(v.id)}
                className="flex items-center justify-between p-5 rounded-[2rem] border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-white transition-all shadow-inner overflow-hidden">
                    {v.photos[v.mainPhotoIndex] ? (
                      <img src={v.photos[v.mainPhotoIndex]} className="w-full h-full object-cover" />
                    ) : (
                      <ICONS.Car className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-lg tracking-tighter">{v.plate}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{v.brand} {v.model}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{v.currentMileage.toLocaleString()} KM</p>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${v.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                    {v.status === 'active' ? 'En Servicio' : 'En Taller'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;
