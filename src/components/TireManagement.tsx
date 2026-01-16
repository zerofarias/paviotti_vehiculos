import React, { useState } from 'react';
import type { Vehicle, Tire } from '../types';

interface TireManagementProps {
    vehicle: Vehicle;
    onUpdateVehicle: (vehicle: Vehicle) => void;
}

const TireManagement: React.FC<TireManagementProps> = ({ vehicle, onUpdateVehicle }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<'FL' | 'FR' | 'RL' | 'RR' | 'SPARE'>('FL');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [size, setSize] = useState('');
    const [installing, setInstalling] = useState(false);

    const tires = vehicle.tires || [];

    const getTireAtPosition = (position: string) => {
        return tires.find(t => t.position === position);
    };

    const calculateLifeUsed = (tire: Tire) => {
        const kmUsed = vehicle.currentMileage - tire.installMileage;
        return Math.min((kmUsed / tire.estimatedLife) * 100, 100);
    };

    const getStatusColor = (tire: Tire) => {
        const lifeUsed = calculateLifeUsed(tire);
        if (lifeUsed >= 90) return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' };
        if (lifeUsed >= 70) return { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200' };
        return { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200' };
    };

    const handleAddTire = async (e: React.FormEvent) => {
        e.preventDefault();
        setInstalling(true);

        try {
            const res = await fetch(`/api/vehicles/${vehicle.id}/tires`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    position: selectedPosition,
                    brand,
                    model,
                    size,
                    installMileage: vehicle.currentMileage
                })
            });

            if (res.ok) {
                const newTire = await res.json();
                const updatedTires = [...tires.filter(t => t.position !== selectedPosition), newTire];
                onUpdateVehicle({ ...vehicle, tires: updatedTires });
                setShowAddForm(false);
                setBrand('');
                setModel('');
                setSize('');
            } else {
                alert('Error al agregar neumático');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        } finally {
            setInstalling(false);
        }
    };

    const handleRotate = async () => {
        if (!confirm('¿Confirmar rotación de neumáticos? (Delanteros ↔ Traseros)')) return;

        try {
            const res = await fetch(`/api/vehicles/${vehicle.id}/tires/rotate`, {
                method: 'PUT'
            });

            if (res.ok) {
                const updatedTires = await res.json();
                onUpdateVehicle({ ...vehicle, tires: updatedTires });
                alert('✅ Rotación completada exitosamente');
            } else {
                alert('Error al rotar neumáticos');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    const TireCard = ({ position, label }: { position: 'FL' | 'FR' | 'RL' | 'RR' | 'SPARE', label: string }) => {
        const tire = getTireAtPosition(position);
        const lifeUsed = tire ? calculateLifeUsed(tire) : 0;
        const colors = tire ? getStatusColor(tire) : { bg: 'bg-slate-300', text: 'text-slate-500', border: 'border-slate-200' };

        return (
            <div className={`relative p-6 rounded-[2rem] border-2 ${colors.border} bg-white shadow-sm hover:shadow-md transition-all`}>
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
                    {tire && (
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${colors.text} bg-opacity-10`} style={{ backgroundColor: colors.text.replace('text-', 'rgb(') }}>
                            {lifeUsed >= 90 ? 'CRÍTICO' : lifeUsed >= 70 ? 'ATENCION' : 'BUENO'}
                        </span>
                    )}
                </div>

                {tire ? (
                    <>
                        <h5 className="font-black text-slate-900 text-sm uppercase mb-1">{tire.brand}</h5>
                        <p className="text-xs text-slate-500 font-medium mb-3">{tire.model} {tire.size}</p>

                        <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Vida Útil</span>
                                <span className="text-[10px] font-black text-slate-900">{lifeUsed.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full ${colors.bg} transition-all duration-500`}
                                    style={{ width: `${lifeUsed}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500 font-medium border-t border-slate-50 pt-3">
                            <div>
                                <span className="block text-[8px] text-slate-400 font-black uppercase">Instalado</span>
                                {tire.installMileage.toLocaleString()} km
                            </div>
                            <div>
                                <span className="block text-[8px] text-slate-400 font-black uppercase">Recorrido</span>
                                {(vehicle.currentMileage - tire.installMileage).toLocaleString()} km
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-slate-300 font-black text-xs uppercase mb-3">Sin Registrar</p>
                        <button
                            onClick={() => {
                                setSelectedPosition(position);
                                setShowAddForm(true);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-sm"
                        >
                            + Agregar
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestión de Neumáticos</h4>
                    <p className="text-slate-500 font-bold text-xs uppercase mt-1">Control de desgaste y rotación</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-slate-800 transition-all"
                    >
                        + Nueva Cubierta
                    </button>
                    {tires.length >= 4 && (
                        <button
                            onClick={handleRotate}
                            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-blue-600 transition-all"
                        >
                            🔄 Rotar Ejes
                        </button>
                    )}
                </div>
            </header>

            {showAddForm && (
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 animate-in fade-in zoom-in-95">
                    <form onSubmit={handleAddTire} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Posición</label>
                                <select value={selectedPosition} onChange={e => setSelectedPosition(e.target.value as any)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-bold text-sm outline-none text-slate-600">
                                    <option value="FL">Delantero Izquierdo (FL)</option>
                                    <option value="FR">Delantero Derecho (FR)</option>
                                    <option value="RL">Trasero Izquierdo (RL)</option>
                                    <option value="RR">Trasero Derecho (RR)</option>
                                    <option value="SPARE">Auxilio</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Marca</label>
                                <input required type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-bold text-sm outline-none" placeholder="Ej: Michelin, Pirelli..." />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Modelo</label>
                                <input type="text" value={model} onChange={e => setModel(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-bold text-sm outline-none" placeholder="Ej: Energy XM2+" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Medida</label>
                                <input type="text" value={size} onChange={e => setSize(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-bold text-sm outline-none" placeholder="Ej: 205/55 R16" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs hover:bg-slate-300">Cancelar</button>
                            <button type="submit" disabled={installing} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-emerald-600 disabled:opacity-50">
                                {installing ? 'Instalando...' : 'Instalar Cubierta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Vehicle Diagram */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-10 rounded-[3rem] border-2 border-slate-200">
                <div className="max-w-2xl mx-auto">
                    <div className="grid grid-cols-2 gap-20">
                        <TireCard position="FL" label="Delantero Izq" />
                        <TireCard position="FR" label="Delantero Der" />
                    </div>

                    {/* Car Body Representation */}
                    <div className="my-8 bg-slate-300 h-48 rounded-[3rem] flex items-center justify-center border-4 border-slate-400 shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-400 opacity-50"></div>
                        <span className="text-6xl font-black text-slate-500 opacity-20 z-10">{vehicle.brand}</span>
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white rounded-xl shadow-sm">
                            <span className="text-xs font-black text-slate-600 uppercase">{vehicle.plate}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20">
                        <TireCard position="RL" label="Trasero Izq" />
                        <TireCard position="RR" label="Trasero Der" />
                    </div>
                </div>

                {/* Spare Tire */}
                <div className="mt-8 max-w-md mx-auto">
                    <TireCard position="SPARE" label="Auxilio" />
                </div>
            </div>

            {/* Stats Summary */}
            {tires.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Promedio de Desgaste</div>
                        <div className="text-3xl font-black text-slate-900">
                            {(tires.reduce((sum, tire) => sum + calculateLifeUsed(tire), 0) / tires.length).toFixed(0)}%
                        </div>
                    </div>
                    <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Cubiertas Instaladas</div>
                        <div className="text-3xl font-black text-slate-900">{tires.length}/5</div>
                    </div>
                    <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Estado General</div>
                        <div className="text-3xl font-black text-emerald-600">
                            {tires.some(t => calculateLifeUsed(t) >= 90) ? '⚠️ CRÍTICO' : tires.some(t => calculateLifeUsed(t) >= 70) ? '⚡ ATENCIÓN' : '✅ BUENO'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TireManagement;
