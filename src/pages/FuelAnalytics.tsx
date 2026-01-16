import React, { useMemo } from 'react';
import { ICONS } from '../constants';
import type { Vehicle, CheckLog } from '../types';
import { CheckType } from '../types';

interface FuelAnalyticsProps {
    vehicles: Vehicle[];
    logs: CheckLog[];
}

const FuelAnalytics: React.FC<FuelAnalyticsProps> = ({ vehicles, logs }) => {
    // Filter only Fuel logs
    const fuelLogs = useMemo(() =>
        logs.filter(l => l.type === CheckType.FUEL).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [logs]);

    // General Stats
    const stats = useMemo(() => {
        const totalLiters = fuelLogs.reduce((acc, l) => acc + (l.details.fuelLiters || 0), 0);
        const totalCost = fuelLogs.reduce((acc, l) => acc + (l.details.fuelCost || 0), 0);
        const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

        return { totalLiters, totalCost, avgPricePerLiter };
    }, [fuelLogs]);

    // Monthly Data for Chart
    const monthlyData = useMemo(() => {
        const data: Record<string, { liters: number, cost: number }> = {};

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
            data[key] = { liters: 0, cost: 0 };
        }

        fuelLogs.forEach(log => {
            const date = new Date(log.timestamp);
            const key = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
            if (data[key]) {
                data[key].liters += (log.details.fuelLiters || 0);
                data[key].cost += (log.details.fuelCost || 0);
            }
        });

        return Object.entries(data).map(([key, val]) => ({ month: key, ...val }));
    }, [fuelLogs]);

    const maxCost = Math.max(...monthlyData.map(d => d.cost), 1);

    // Efficiency per Vehicle (Simple approx)
    const vehicleEfficiency = useMemo(() => {
        return vehicles.map(v => {
            const vLogs = fuelLogs.filter(l => l.vehicleId === v.id);
            const liters = vLogs.reduce((acc, l) => acc + (l.details.fuelLiters || 0), 0);
            const cost = vLogs.reduce((acc, l) => acc + (l.details.fuelCost || 0), 0);
            return {
                plate: v.plate,
                brand: v.brand,
                model: v.model,
                liters,
                cost,
                photo: v.photos[0]
            };
        }).sort((a, b) => b.cost - a.cost);
    }, [vehicles, fuelLogs]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Control de Combustible</h2>
                <p className="text-slate-500 font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Analíticas de Consumo y Costos</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full"></div>
                    <ICONS.Fuel className="w-8 h-8 text-amber-500 mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gasto Total (Histórico)</p>
                    <p className="text-4xl font-black mt-2">${stats.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo Total</p>
                    <p className="text-4xl font-black mt-2 text-slate-900">{stats.totalLiters.toLocaleString()} <span className="text-lg text-slate-400">L</span></p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
                        <span className="font-bold text-lg">$</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Promedio</p>
                    <p className="text-4xl font-black mt-2 text-slate-900">${Math.round(stats.avgPricePerLiter)} <span className="text-lg text-slate-400">/ L</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Monthly Chart */}
                <section className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Evolución de Gasto Mensual</h3>
                    <div className="h-64 w-full flex items-end justify-between gap-4 px-4">
                        {monthlyData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <div
                                    className="w-full bg-amber-500/10 border-t-4 border-amber-500 rounded-t-xl transition-all hover:bg-amber-500 hover:scale-[1.02] origin-bottom duration-500"
                                    style={{ height: `${Math.max((d.cost / maxCost) * 100, 5)}%` }}
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-10 pointer-events-none transition-opacity">
                                        ${d.cost.toLocaleString()}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 mt-4 uppercase">{d.month}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Top Consumers */}
                <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl flex flex-col">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                        <ICONS.Fuel className="text-amber-500" /> Top Consumo
                    </h3>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '300px' }}>
                        {vehicleEfficiency.slice(0, 5).map((v, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden">
                                    {v.photo ? <img src={v.photo} className="w-full h-full object-cover" /> : <ICONS.Car className="w-full h-full p-2 text-slate-600" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black uppercase">{v.plate}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{v.brand} {v.model}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-amber-500">${v.cost.toLocaleString()}</p>
                                    <p className="text-[9px] text-slate-500 font-bold">{v.liters} L</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Recent Logs Table */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Últimas Cargas Registradas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chofer</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Litros</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Costo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fuelLogs.slice(0, 10).map(log => {
                                const vehicle = vehicles.find(v => v.id === log.vehicleId);
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-6 text-xs font-bold text-slate-600">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                            <span className="block text-[9px] text-slate-400 font-normal">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className="font-black text-slate-900 uppercase text-xs block">{vehicle?.plate || '???'}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">{vehicle?.brand} {vehicle?.model}</span>
                                        </td>
                                        <td className="p-6 text-xs font-bold text-slate-600">{log.userName}</td>
                                        <td className="p-6 text-xs font-black text-slate-900 text-right">{log.details.fuelLiters} L</td>
                                        <td className="p-6 text-xs font-black text-emerald-600 text-right">${log.details.fuelCost?.toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default FuelAnalytics;
