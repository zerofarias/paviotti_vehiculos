
import React, { useState } from 'react';
import type { Vehicle, MaintenanceConfig, DamagePoint, FuelLog, InventoryItem } from '../types';
import { ICONS } from '../constants';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  config: MaintenanceConfig;
  onAddVehicle: (v: Omit<Vehicle, 'id' | 'status' | 'lastServiceMileage' | 'lastServiceDate'>) => void;
  isAdmin: boolean;
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onSelectVehicle, config, onAddVehicle, isAdmin }) => {
  const [filter, setFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<Vehicle | null>(null);

  // Added required collections to satisfy Vehicle partial type for onAddVehicle
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    brand: '',
    model: '',
    color: '#000000',
    year: new Date().getFullYear(),
    chassisNumber: '',
    motorNumber: '',
    currentMileage: 0,
    photos: [] as string[],
    mainPhotoIndex: 0,
    damagePoints: [] as DamagePoint[],
    fuelLogs: [] as FuelLog[],
    inventory: [] as InventoryItem[]
  });

  const filteredVehicles = vehicles.filter(v =>
    v.plate.toLowerCase().includes(filter.toLowerCase()) ||
    v.brand.toLowerCase().includes(filter.toLowerCase()) ||
    v.model.toLowerCase().includes(filter.toLowerCase())
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).slice(0, 4 - newVehicle.photos.length).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewVehicle(prev => ({ ...prev, photos: [...prev.photos, reader.result as string] }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVehicle(newVehicle);
    setShowAddModal(false);
    // Reset state with all required fields
    setNewVehicle({
      plate: '',
      brand: '',
      model: '',
      color: '#000000',
      year: new Date().getFullYear(),
      chassisNumber: '',
      motorNumber: '',
      currentMileage: 0,
      photos: [],
      mainPhotoIndex: 0,
      damagePoints: [],
      fuelLogs: [],
      inventory: []
    });
  };

  return (
    <div className="w-full space-y-6 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Flota Vehicular</h2>
          <p className="text-slate-500 font-medium">Gestión integral de unidades funerarias.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200 uppercase tracking-widest">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
              Nueva Unidad
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => {
          const daysSinceCheck = v.lastCheckDate
            ? Math.floor((new Date().getTime() - new Date(v.lastCheckDate).getTime()) / (1000 * 3600 * 24))
            : 999;
          const isOverdue = daysSinceCheck >= (config.checkIntervalDays || 7);

          return (
            <div key={v.id} className={`group bg-white rounded-[2.5rem] border shadow-sm overflow-hidden hover:shadow-2xl transition-all flex flex-col relative ${isOverdue ? 'border-red-200 ring-4 ring-red-50' : 'border-slate-100 hover:border-blue-100'}`}>

              <button
                onClick={(e) => { e.stopPropagation(); setShowQRModal(v); }}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-slate-900 shadow-xl border border-white/20 hover:scale-110 transition-transform"
              >
                <ICONS.QRCode className="w-6 h-6" />
              </button>

              <div onClick={() => onSelectVehicle(v.id)} className="cursor-pointer aspect-[16/10] bg-slate-50 relative overflow-hidden">
                {v.photos.length > 0 ? (
                  <img src={v.photos[v.mainPhotoIndex]} alt={v.plate} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <ICONS.Car className="w-20 h-20" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-widest">{v.plate}</span>
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: v.color }}></div>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${v.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {v.status === 'active' ? 'Operativo' : 'En Taller'}
                  </span>
                </div>
              </div>

              <div onClick={() => onSelectVehicle(v.id)} className="p-8 cursor-pointer">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{v.brand} {v.model}</h3>
                <p className="text-sm text-slate-400 font-bold mb-6 tracking-tighter uppercase">{v.year} • {v.currentMileage.toLocaleString()} KM TOTALES</p>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between text-[10px]">
                  <div>
                    <p className="text-slate-300 font-black uppercase tracking-widest mb-1">Último Control</p>
                    <p className="text-slate-700 font-black uppercase">{v.lastCheckUser || 'Sin registro'}</p>
                  </div>

                  {(() => {
                    const daysSinceCheck = v.lastCheckDate
                      ? Math.floor((new Date().getTime() - new Date(v.lastCheckDate).getTime()) / (1000 * 3600 * 24))
                      : 999;
                    const isOverdue = daysSinceCheck >= (config.checkIntervalDays || 7);

                    const kmSinceService = v.currentMileage - v.lastServiceMileage;
                    const dateLastService = v.lastServiceDate ? new Date(v.lastServiceDate) : new Date();
                    const monthsSinceService = (new Date().getTime() - dateLastService.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

                    const isServiceOverdue = kmSinceService >= (config.serviceKmInterval || 10000) ||
                      monthsSinceService >= (config.serviceMonthInterval || 6);

                    return (
                      <div className="flex gap-2">
                        {isServiceOverdue && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 animate-pulse" title="Mantenimiento Requerido">
                            <ICONS.Alert className="w-4 h-4" />
                            <span className="font-black uppercase tracking-wider hidden sm:inline">Service</span>
                          </div>
                        )}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isOverdue ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-blue-600 border-slate-100'}`}>
                          {isOverdue ? (
                            <>
                              <span className="font-black uppercase tracking-wider">Revisar</span>
                              <ICONS.Alert className="w-4 h-4" />
                            </>
                          ) : (
                            <ICONS.Check className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {
        showQRModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] p-12 text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
              <header className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Acceso Directo QR</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{showQRModal.plate}</p>
              </header>
              <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 flex justify-center mb-8 relative">
                <ICONS.QRCode className="w-48 h-48 text-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <ICONS.Car className="w-32 h-32" />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed">Pega este código en el parabrisas de la unidad para que los choferes accedan instantáneamente a la ficha de control.</p>
              <div className="flex flex-col gap-3">
                <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Imprimir Etiqueta</button>
                <button onClick={() => setShowQRModal(null)} className="w-full py-4 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest">Cerrar</button>
              </div>
            </div>
          </div>
        )
      }

      {
        showAddModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <header className="px-10 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nueva Unidad Paviotti</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-900 text-4xl font-light">×</button>
              </header>
              <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patente</label>
                    <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold" value={newVehicle.plate} onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })} placeholder="ABC-123" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Color Carrocería</label>
                    <div className="flex gap-2">
                      <input type="color" className="w-14 h-14 p-1 bg-white border-2 border-slate-100 rounded-2xl" value={newVehicle.color} onChange={e => setNewVehicle({ ...newVehicle, color: e.target.value })} />
                      <input className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase" value={newVehicle.color} onChange={e => setNewVehicle({ ...newVehicle, color: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Marca</label>
                    <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" value={newVehicle.brand} onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })} placeholder="Ej: Mercedes-Benz" />
                  </div>
                  <div>
                    <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="Ej: Sprinter 516" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Año</label>
                    <input required type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear() })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">N° Chasis</label>
                    <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" value={newVehicle.chassisNumber || ''} onChange={e => setNewVehicle({ ...newVehicle, chassisNumber: e.target.value })} placeholder="Opcional" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">N° Motor</label>
                    <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl" value={newVehicle.motorNumber || ''} onChange={e => setNewVehicle({ ...newVehicle, motorNumber: e.target.value })} placeholder="Opcional" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fotos de Presentación (Máx 4)</label>
                  <div className="grid grid-cols-4 gap-3">
                    {newVehicle.photos.map((photo, i) => (
                      <div key={i} className={`aspect-square rounded-2xl overflow-hidden border-2 ${newVehicle.mainPhotoIndex === i ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100'} relative`}>
                        <img src={photo} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setNewVehicle({ ...newVehicle, mainPhotoIndex: i })} className="absolute bottom-1 right-1 bg-blue-600 text-white text-[7px] p-1 px-2 rounded-full font-black uppercase">Main</button>
                      </div>
                    ))}
                    {newVehicle.photos.length < 4 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all hover:border-blue-300">
                        <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" /></svg>
                        <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kilometraje Inicial de Alta</label>
                  <input type="number" required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-center" value={newVehicle.currentMileage || ''} onChange={e => setNewVehicle({ ...newVehicle, currentMileage: parseInt(e.target.value) || 0 })} />
                </div>

                <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] uppercase tracking-widest text-sm">
                  Dar de Alta en Flota
                </button>
              </form>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default VehicleList;
