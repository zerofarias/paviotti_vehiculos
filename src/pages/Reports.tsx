
import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import type { Vehicle, CheckLog, VehicleNote } from '../types';
import { ICONS, COLORS } from '../constants';

interface ReportsProps {
    vehicles: Vehicle[];
    logs: CheckLog[];
}

const Reports: React.FC<ReportsProps> = ({ vehicles, logs }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'fuel' | 'maintenance' | 'export'>('general');

    // --- DATA PROCESSING ---

    // Vehicle Status Distribution
    const statusData = useMemo(() => {
        const counts = vehicles.reduce((acc, v) => {
            const status = v.status || 'active';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
    }, [vehicles]);

    // Fuel Usage per Vehicle (Total Liters)
    const fuelData = useMemo(() => {
        const data: Record<string, number> = {};
        logs.forEach(log => {
            if (log.details.fuelLiters && log.details.fuelLiters > 0) {
                const v = vehicles.find(veh => veh.id === log.vehicleId);
                const name = v ? `${v.brand} ${v.model} (${v.plate})` : 'Unknown';
                data[name] = (data[name] || 0) + log.details.fuelLiters;
            }
        });
        return Object.entries(data)
            .map(([name, liters]) => ({ name, liters }))
            .sort((a, b) => b.liters - a.liters)
            .slice(0, 5); // Top 5
    }, [logs, vehicles]);

    // Maintenance Costs per Month
    const costData = useMemo(() => {
        const data: Record<string, number> = {};
        logs.forEach(log => {
            const cost = (log.details.serviceCost || 0) + (log.details.fuelCost || 0);
            if (cost > 0) {
                const date = new Date(log.timestamp);
                const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
                data[key] = (data[key] || 0) + cost;
            }
        });
        return Object.entries(data)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => {
                const [m1, y1] = a.date.split('/').map(Number);
                const [m2, y2] = b.date.split('/').map(Number);
                return new Date(y1, m1).getTime() - new Date(y2, m2).getTime();
            });
    }, [logs]);


    // --- EXPORT FUNCTION ---
    const handleExport = (type: 'vehicles' | 'logs') => {
        const wb = XLSX.utils.book_new();
        let ws;

        if (type === 'vehicles') {
            const data = vehicles.map(v => ({
                Placa: v.plate,
                Marca: v.brand,
                Modelo: v.model,
                Año: v.year,
                Estado: v.status,
                Kilometraje: v.currentMileage,
                'Último Service': v.lastServiceMileage,
                'Vencimiento Seguro': v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString() : 'N/A',
                'Vencimiento VTV': v.vtvExpiry ? new Date(v.vtvExpiry).toLocaleDateString() : 'N/A'
            }));
            ws = XLSX.utils.json_to_sheet(data);
        } else {
            const data = logs.map(l => ({
                Fecha: new Date(l.timestamp).toLocaleDateString(),
                Hora: new Date(l.timestamp).toLocaleTimeString(),
                Vehículo: vehicles.find(v => v.id === l.vehicleId)?.plate || 'N/A',
                Usuario: l.userName,
                Tipo: l.type,
                Kilometraje: l.mileage,
                'Litros Combustible': l.details.fuelLiters || 0,
                'Costo Combustible': l.details.fuelCost || 0,
                'Costo Servicio': l.details.serviceCost || 0,
                Taller: l.details.workshopName || '',
                Notas: l.details.notes || ''
            }));
            ws = XLSX.utils.json_to_sheet(data);
        }

        XLSX.utils.book_append_sheet(wb, ws, "Datos");
        XLSX.writeFile(wb, `Reporte_Paviotti_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const STATUS_COLORS = [COLORS.success, COLORS.warning, COLORS.danger, COLORS.secondary];

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Reportes</h1>
                    <p className="text-slate-500 font-bold text-sm uppercase mt-1">Análisis y Exportación de Datos</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    {['general', 'fuel', 'maintenance', 'export'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {tab === 'fuel' ? 'Combustible' : tab === 'maintenance' ? 'Costos' : tab === 'export' ? 'Exportar' : 'General'}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-6 flex items-center gap-3">
                            <span className="bg-blue-100 text-blue-600 p-2 rounded-xl"><ICONS.Car className="w-5 h-5" /></span>
                            Estado de la Flota
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
                        <h3 className="text-xl font-black uppercase mb-6 relative z-10">Resumen Rápido</h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-md">
                                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total Vehículos</p>
                                <p className="text-4xl font-black">{vehicles.length}</p>
                            </div>
                            <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-md">
                                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Alertas Activas</p>
                                <p className="text-4xl font-black text-red-400">
                                    {vehicles.filter(v => {
                                        // VTV or Insurance Expired
                                        const docExpired = (v.vtvExpiry && new Date(v.vtvExpiry) < new Date()) ||
                                            (v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date());

                                        // Service Maintenance Needed
                                        const kmSinceService = v.currentMileage - v.lastServiceMileage;
                                        const dateLastService = v.lastServiceDate ? new Date(v.lastServiceDate) : new Date();
                                        const monthsSinceService = (new Date().getTime() - dateLastService.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                                        const serviceNeeded = kmSinceService >= 10000 || monthsSinceService >= 6; // Using defaults if config not passed props, ideally config should be passed to Reports

                                        return docExpired || serviceNeeded;
                                    }).length}
                                </p>
                            </div>
                            <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-md">
                                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Registros este mes</p>
                                <p className="text-4xl font-black text-emerald-400">
                                    {logs.filter(l => new Date(l.timestamp).getMonth() === new Date().getMonth()).length}
                                </p>
                            </div>
                            <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-md">
                                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Costo Total (Mes)</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-slate-400">$</span>
                                    <p className="text-3xl font-black text-blue-400">
                                        {logs
                                            .filter(l => new Date(l.timestamp).getMonth() === new Date().getMonth())
                                            .reduce((sum, l) => sum + (l.details.fuelCost || 0) + (l.details.serviceCost || 0), 0)
                                            .toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'fuel' && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><ICONS.Fuel className="w-5 h-5" /></span>
                        Top 5 Consumo de Combustible (Litros)
                    </h3>
                    <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fuelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="liters" fill="#10b981" radius={[0, 10, 10, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-3">
                            <span className="bg-red-100 text-red-600 p-2 rounded-xl"><ICONS.Settings className="w-5 h-5" /></span>
                            Evolución de Costos (Combustible + Mantenimiento)
                        </h3>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={costData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={4} dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <CostDetailReport vehicles={vehicles} logs={logs} />
                </div>
            )}

            {activeTab === 'export' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div onClick={() => handleExport('vehicles')} className="group bg-slate-900 p-10 rounded-[3rem] text-white cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity"></div>
                        <ICONS.Car className="w-12 h-12 mb-6 text-blue-400" />
                        <h3 className="text-2xl font-black uppercase mb-2">Exportar Flota</h3>
                        <p className="text-slate-400 font-medium text-sm mb-6">Descargar listado completo de vehículos, estados y vencimientos en formato Excel.</p>
                        <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                            Descargar .XLSX <span>→</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CostDetailReport: React.FC<{ vehicles: Vehicle[], logs: CheckLog[] }> = ({ vehicles, logs }) => {
    // Default range: 30 days
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [allNotes, setAllNotes] = useState<VehicleNote[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(true);

    // Fetch all vehicle notes
    React.useEffect(() => {
        const fetchAllNotes = async () => {
            setLoadingNotes(true);
            try {
                const notesPromises = vehicles.map(v =>
                    fetch(`/api/vehicles/${v.id}/notes`)
                        .then(res => res.ok ? res.json() : [])
                        .catch(() => [])
                );
                const notesArrays = await Promise.all(notesPromises);
                const flatNotes = notesArrays.flat();
                setAllNotes(flatNotes);
            } catch (e) {
                console.error('Error fetching notes:', e);
            } finally {
                setLoadingNotes(false);
            }
        };

        if (vehicles.length > 0) {
            fetchAllNotes();
        }
    }, [vehicles]);

    const reportData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filteredLogs = logs.filter(l => {
            const d = new Date(l.timestamp);
            return d >= start && d <= end;
        });

        const filteredNotes = allNotes.filter(n => {
            const d = new Date(n.date);
            return d >= start && d <= end;
        });

        const grouped = filteredLogs.reduce((acc, log) => {
            if (!acc[log.vehicleId]) {
                acc[log.vehicleId] = {
                    fuelCost: 0,
                    serviceCost: 0,
                    notesCost: 0,
                    totalCost: 0,
                    fuelLiters: 0,
                    logsCount: 0
                };
            }
            const fuel = log.details.fuelCost || 0;
            const service = log.details.serviceCost || 0;

            acc[log.vehicleId].fuelCost += fuel;
            acc[log.vehicleId].serviceCost += service;
            acc[log.vehicleId].totalCost += (fuel + service);
            acc[log.vehicleId].fuelLiters += (log.details.fuelLiters || 0);
            acc[log.vehicleId].logsCount += 1;
            return acc;
        }, {} as Record<string, { fuelCost: number, serviceCost: number, notesCost: number, totalCost: number, fuelLiters: number, logsCount: number }>);

        // Add notes costs
        filteredNotes.forEach(note => {
            if (!grouped[note.vehicleId]) {
                grouped[note.vehicleId] = {
                    fuelCost: 0,
                    serviceCost: 0,
                    notesCost: 0,
                    totalCost: 0,
                    fuelLiters: 0,
                    logsCount: 0
                };
            }
            const noteCost = note.cost || 0;
            grouped[note.vehicleId].notesCost += noteCost;
            grouped[note.vehicleId].totalCost += noteCost;
        });

        return Object.entries(grouped).map(([vId, stats]) => {
            const v = vehicles.find(veh => veh.id === vId);
            return {
                vehicle: v,
                ...stats
            };
        }).sort((a, b) => b.totalCost - a.totalCost);

    }, [logs, vehicles, startDate, endDate, allNotes]);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">
                    <span className="bg-slate-100 text-slate-600 p-2 rounded-xl"><ICONS.Inventory className="w-5 h-5" /></span>
                    Detalle de Gastos por Vehículo
                </h3>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase text-slate-600 outline-none"
                    />
                    <span className="text-slate-400 font-black">-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase text-slate-600 outline-none"
                    />
                </div>
            </div>

            {loadingNotes ? (
                <div className="text-center py-8">
                    <p className="text-slate-400 font-bold text-xs uppercase">Cargando gastos...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-100">
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Vehículo</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Combustible ($)</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Service Taller ($)</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Otros Gastos ($)</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Total ($)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reportData.map((row) => (
                                <tr key={row.vehicle?.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div>
                                            <p className="font-black text-slate-900 uppercase text-xs">{row.vehicle?.plate || 'Desconocido'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{row.vehicle?.brand} {row.vehicle?.model}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className="font-bold text-amber-600 text-xs">${row.fuelCost.toLocaleString()}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{Math.round(row.fuelLiters)} Litros</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className="font-bold text-blue-600 text-xs">${row.serviceCost.toLocaleString()}</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className="font-bold text-purple-600 text-xs">${row.notesCost.toLocaleString()}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Bitácora</p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <p className="font-black text-slate-900 text-sm">${row.totalCost.toLocaleString()}</p>
                                    </td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        No hay registros en este periodo
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 border-slate-100">
                            <tr>
                                <td className="p-4 font-black uppercase text-xs text-slate-500">Total General</td>
                                <td className="p-4 text-right font-black text-xs text-slate-900">${reportData.reduce((acc, r) => acc + r.fuelCost, 0).toLocaleString()}</td>
                                <td className="p-4 text-right font-black text-xs text-slate-900">${reportData.reduce((acc, r) => acc + r.serviceCost, 0).toLocaleString()}</td>
                                <td className="p-4 text-right font-black text-xs text-slate-900">${reportData.reduce((acc, r) => acc + r.notesCost, 0).toLocaleString()}</td>
                                <td className="p-4 text-right font-black text-sm text-slate-900 border-l border-slate-200 bg-slate-100">${reportData.reduce((acc, r) => acc + r.totalCost, 0).toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Reports;
