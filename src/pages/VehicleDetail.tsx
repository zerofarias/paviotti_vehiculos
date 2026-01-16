
import React, { useState, useRef } from 'react';
import { CheckType, UserRole } from '../types';
import type { Vehicle, CheckLog, MaintenanceConfig, User, FluidLevel, DamagePoint, FuelLog, VehicleNote, Tire } from '../types';
import { ICONS } from '../constants';
import TireManagement from '../components/TireManagement';

interface VehicleDetailProps {
  vehicle: Vehicle;
  logs: CheckLog[];
  config: MaintenanceConfig;
  onBack: () => void;
  onAddLog: (log: Omit<CheckLog, 'id'>) => void;
  currentUser: User;
  onUpdateVehicle: (vehicle: Vehicle) => void;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle, logs, config, onBack, onAddLog, currentUser, onUpdateVehicle
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'damage' | 'fuel' | 'inventory' | 'services' | 'timeline' | 'tires'>('info');
  const [showLogForm, setShowLogForm] = useState(false);
  const [logType, setLogType] = useState<CheckType>(CheckType.WEEKLY_SAFETY);
  const [notes, setNotes] = useState('');
  const [newMileage, setNewMileage] = useState(vehicle.currentMileage.toString());

  const [tirePressure, setTirePressure] = useState('');
  const [oilLevel, setOilLevel] = useState<FluidLevel | null>(null);
  const [coolantLevel, setCoolantLevel] = useState<FluidLevel | null>(null);
  const [brakeLevel, setBrakeLevel] = useState<FluidLevel | null>(null);
  const [wiperLevel, setWiperLevel] = useState<FluidLevel | null>(null);
  const [lightsOk, setLightsOk] = useState<boolean | null>(null);
  const [hornOk, setHornOk] = useState<boolean | null>(null);
  const [fireExtOk, setFireExtOk] = useState<boolean | null>(null);
  const [fireExtExpiry, setFireExtExpiry] = useState('');
  const [spareTireOk, setSpareTireOk] = useState<boolean | null>(null);
  const [cleanlinessOk, setCleanlinessOk] = useState<boolean | null>(null);
  const [uniformOk, setUniformOk] = useState<boolean | null>(null);

  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [ticketPhoto, setTicketPhoto] = useState('');

  const damageCanvasRef = useRef<HTMLDivElement>(null);
  const [tempDamage, setTempDamage] = useState<{ x: number, y: number } | null>(null);

  // Repair Modal State
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedDamageId, setSelectedDamageId] = useState<string | null>(null);
  const [repairCostInput, setRepairCostInput] = useState('');
  const [repairNotesInput, setRepairNotesInput] = useState('');

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    const mileageNum = parseInt(newMileage);

    onAddLog({
      vehicleId: vehicle.id,
      userId: currentUser.id,
      userName: currentUser.name,
      type: logType,
      timestamp: new Date().toISOString(),
      mileage: mileageNum,
      details: {
        notes,
        tirePressurePsi: logType === CheckType.WEEKLY_SAFETY ? parseInt(tirePressure) : undefined,
        oilLevel: logType === CheckType.WEEKLY_SAFETY ? oilLevel as FluidLevel : undefined,
        coolantLevel: logType === CheckType.WEEKLY_SAFETY ? coolantLevel as FluidLevel : undefined,
        brakeFluidLevel: logType === CheckType.WEEKLY_SAFETY ? brakeLevel as FluidLevel : undefined,
        wiperFluidLevel: logType === CheckType.WEEKLY_SAFETY ? wiperLevel as FluidLevel : undefined,
        lightsOk: logType === CheckType.WEEKLY_SAFETY ? (lightsOk as boolean) : undefined,
        hornOk: logType === CheckType.WEEKLY_SAFETY ? (hornOk as boolean) : undefined,
        fireExtinguisherOk: logType === CheckType.WEEKLY_SAFETY ? (fireExtOk as boolean) : undefined,
        fireExtinguisherExpiry: logType === CheckType.WEEKLY_SAFETY ? fireExtExpiry : undefined,
        spareTireOk: logType === CheckType.WEEKLY_SAFETY ? (spareTireOk as boolean) : undefined,
        cleanlinessOk: logType === CheckType.WEEKLY_SAFETY ? (cleanlinessOk as boolean) : undefined,
        uniformOk: logType === CheckType.WEEKLY_SAFETY ? (uniformOk as boolean) : undefined,
        fuelLiters: logType === CheckType.FUEL ? parseFloat(fuelLiters) : undefined,
        fuelCost: logType === CheckType.FUEL ? parseFloat(fuelCost) : undefined,
        workshopName: logType === CheckType.SERVICE ? workshopName : undefined,
        serviceCost: logType === CheckType.SERVICE ? parseFloat(serviceCost) : undefined,
        ticketPhoto: logType === CheckType.FUEL ? ticketPhoto : undefined
      }
    });

    if (logType === CheckType.SERVICE) {
      onUpdateVehicle({
        ...vehicle,
        currentMileage: Math.max(vehicle.currentMileage, mileageNum),
        lastServiceMileage: mileageNum,
        lastServiceDate: new Date().toISOString(),
        status: 'active'
      });
    } else if (logType === CheckType.FUEL) {
      const newFuelLog: FuelLog = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        mileage: mileageNum,
        liters: parseFloat(fuelLiters),
        cost: parseFloat(fuelCost),
        ticketPhoto: ticketPhoto
      };
      onUpdateVehicle({
        ...vehicle,
        currentMileage: Math.max(vehicle.currentMileage, mileageNum),
        fuelLogs: [newFuelLog, ...(vehicle.fuelLogs || [])]
      });
    } else {
      onUpdateVehicle({
        ...vehicle,
        currentMileage: Math.max(vehicle.currentMileage, mileageNum),
        lastCheckDate: new Date().toISOString(),
        lastCheckUser: currentUser.name
      });
    }

    setShowLogForm(false);
    setNotes('');
  };

  const handleAddDamage = (e: React.MouseEvent) => {
    if (!damageCanvasRef.current) return;
    const rect = damageCanvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTempDamage({ x, y });
  };

  const handleSaveDamage = () => {
    if (!tempDamage || !notes.trim()) return;
    const newPoint: DamagePoint = {
      id: Math.random().toString(36).substr(2, 9),
      x: tempDamage.x,
      y: tempDamage.y,
      description: notes,
      date: new Date().toISOString(),
      severity: 'medium'
    };
    onUpdateVehicle({
      ...vehicle,
      damagePoints: [...(vehicle.damagePoints || []), newPoint]
    });
    setTempDamage(null);
    setNotes('');
  };




  const handleConfirmRepair = async () => {
    if (!selectedDamageId) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/repair-damage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          damagePointIds: [selectedDamageId],
          repairedBy: currentUser.name,
          cost: repairCostInput,
          notes: repairNotesInput
        })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateVehicle(updated);
        setShowRepairModal(false);
        setRepairCostInput('');
        setRepairNotesInput('');
      } else {
        alert('Error al registrar reparación');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInventory = (itemId: string) => {
    const updatedInv = (vehicle.inventory || []).map(item =>
      item.id === itemId ? { ...item, present: !item.present } : item
    );
    onUpdateVehicle({ ...vehicle, inventory: updatedInv });
  };

  const FluidControl = ({ label, icon, value, onChange }: { label: string, icon: any, value: FluidLevel | null, onChange: (v: FluidLevel) => void }) => (
    <div className={`p-4 rounded-[1.5rem] border transition-all duration-300 relative overflow-hidden group hover:shadow-lg ${value === 'low' ? 'bg-red-50 border-red-200' : value === 'normal' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
      {/* Background Gradient Effect */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-500 ${value === 'low' ? 'bg-red-500' : value === 'normal' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl drop-shadow-sm">{icon}</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 leading-tight">{label}</span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange('normal')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${value === 'normal' ? 'bg-emerald-500 text-white shadow-emerald-500/30 scale-105' : 'bg-white text-emerald-600 hover:bg-emerald-50'}`}
          >OK</button>
          <button
            type="button"
            onClick={() => onChange('low')}
            className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${value === 'low' ? 'bg-red-500 text-white shadow-red-500/30 scale-105 animate-pulse' : 'bg-white text-red-600 hover:bg-red-50'}`}
          >Bajo</button>
        </div>
      </div>
    </div>
  );

  const StatusToggle = ({ label, value, onChange }: { label: string, value: boolean | null, onChange: (v: boolean) => void }) => (
    <div className={`p-5 rounded-[1.5rem] border transition-all duration-300 flex items-center justify-between group hover:shadow-md ${value === false ? 'bg-red-50 border-red-200 shadow-red-100' : value === true ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">{label}</span>

      <div className="flex bg-white p-1 rounded-xl shadow-inner border border-slate-100">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`w-10 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${value === true ? 'bg-emerald-500 text-white shadow-md font-bold' : 'text-slate-300 hover:text-emerald-500'}`}
        >✔️</button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`w-10 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${value === false ? 'bg-red-500 text-white shadow-md font-bold' : 'text-slate-300 hover:text-red-500'}`}
        >⚠️</button>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-3 md:space-y-6 max-w-5xl mx-auto pb-6 md:pb-24 animate-in fade-in duration-500">
      {/* Mobile-Optimized Back Button */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold uppercase text-xs tracking-widest touch-target">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          <span className="hidden sm:inline">Volver</span>
        </button>
      </div>

      {/* Action Buttons - Mobile First (Moved to Top) */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <button
          onClick={() => { setLogType(CheckType.WEEKLY_SAFETY); setShowLogForm(true); }}
          className="px-3 py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center gap-1"
        >
          <span className="text-lg">✓</span>
          <span>Control</span>
        </button>
        <button
          onClick={() => { setLogType(CheckType.SERVICE); setShowLogForm(true); }}
          className="px-3 py-4 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center gap-1"
        >
          <span className="text-lg">🛠️</span>
          <span>Taller</span>
        </button>
        <button
          onClick={() => { setLogType(CheckType.FUEL); setShowLogForm(true); }}
          className="px-3 py-4 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center gap-1"
        >
          <span className="text-lg">⛽</span>
          <span>Combustible</span>
        </button>
      </div>

      {/* Service Alert - Mobile Optimized */}
      {(() => {
        const kmSinceService = vehicle.currentMileage - vehicle.lastServiceMileage;
        const monthsSinceService = vehicle.lastServiceDate
          ? (new Date().getTime() - new Date(vehicle.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
          : 0;

        const serviceNeeded = kmSinceService >= (config.serviceKmInterval || 10000) ||
          monthsSinceService >= (config.serviceMonthInterval || 6);

        if (serviceNeeded) {
          return (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-3 md:p-4 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
                  <ICONS.Alert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-black text-amber-900 uppercase tracking-tight">⚠️ Mantenimiento</h3>
                  <p className="text-xs text-amber-700 font-medium mt-0.5">
                    {kmSinceService.toLocaleString()} km / {monthsSinceService.toFixed(0)} meses
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Header con foto y datos principales */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 md:p-10 bg-slate-900 text-white flex flex-col md:flex-row items-center gap-4 md:gap-10">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-4 md:border-8 border-white/5 shadow-2xl shrink-0">
            <img src={vehicle.photos[vehicle.mainPhotoIndex] || `https://picsum.photos/seed/${vehicle.id}/400`} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center md:text-left w-full">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter">{vehicle.plate}</h2>
            <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 mt-3 md:mt-4 justify-center md:justify-start">
              <div>
                <p className="text-slate-500 font-black uppercase text-[9px] mb-1">KM Actual</p>
                <p className="text-lg sm:text-xl md:text-2xl font-black">{vehicle.currentMileage.toLocaleString()} KM</p>
              </div>
              <div className="w-px h-10 bg-slate-800 hidden md:block"></div>
              <div>
                <p className="text-violet-500 font-black uppercase text-[9px] mb-1">Último Service Taller</p>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-violet-400">{vehicle.lastServiceMileage.toLocaleString()} KM</p>
              </div>
            </div>
          </div>
          <button onClick={() => { setLogType(CheckType.WEEKLY_SAFETY); setShowLogForm(true); }} className="hidden md:block px-6 md:px-8 py-3 md:py-4 bg-blue-600 rounded-[1.5rem] font-black text-xs uppercase shadow-2xl">Control Personal</button>
        </div>

        <div className="flex border-b px-1 sm:px-3 md:px-8 bg-slate-50 overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch">
          {[
            { id: 'info', label: 'Historial', icon: ICONS.Dashboard },
            { id: 'docs', label: 'Docs', icon: ICONS.Folder },
            { id: 'services', label: 'Taller', icon: ICONS.Settings },
            { id: 'damage', label: 'Daños', icon: ICONS.Damage },
            { id: 'fuel', label: 'Combustible', icon: ICONS.Fuel },
            { id: 'inventory', label: 'Inventario', icon: ICONS.Inventory },
            { id: 'timeline', label: 'Bitácora', icon: ICONS.Folder },
            { id: 'tires', label: 'Neumáticos', icon: ICONS.Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2 sm:px-4 md:px-6 py-2.5 sm:py-4 md:py-6 text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase transition-all relative shrink-0 min-w-[64px] sm:min-w-0 ${activeTab === tab.id ? 'text-blue-600 bg-blue-50/30' : 'text-slate-500'}`}
            >
              <tab.icon className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="leading-tight text-center">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-1 right-1 sm:left-4 sm:right-4 md:left-6 md:right-6 h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="p-3 sm:p-6 md:p-10">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h4 className="text-2xl font-black text-slate-900 uppercase">Historial de Controles</h4>
              {logs.filter(l => l.type === CheckType.WEEKLY_SAFETY).length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sin registros de control</p>
                </div>
              ) : (
                logs.filter(l => l.type === CheckType.WEEKLY_SAFETY).map(log => (
                  <div key={log.id} className="group p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-lg transition-all flex flex-col md:flex-row gap-6">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                        {new Date(log.timestamp).getDate()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase">{new Date(log.timestamp).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">{new Date(log.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs</p>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Chofer</p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.userName}`} alt="" />
                          </div>
                          <p className="text-xs font-black text-slate-900 uppercase truncate">{log.userName}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Kilometraje</p>
                        <p className="text-sm font-black text-slate-900">{log.mileage.toLocaleString()} KM</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fluidos</p>
                        <div className="flex gap-1">
                          {[log.details.oilLevel, log.details.coolantLevel, log.details.brakeFluidLevel, log.details.wiperFluidLevel].every(l => l === 'normal') ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[8px] font-black uppercase">Normales</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[8px] font-black uppercase">Revisar</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Presentación</p>
                        <div className="flex gap-2">
                          <span title="Limpieza" className={`text-xs ${log.details.cleanlinessOk ? 'grayscale-0' : 'grayscale opacity-30'}`}>✨</span>
                          <span title="Uniforme" className={`text-xs ${log.details.uniformOk ? 'grayscale-0' : 'grayscale opacity-30'}`}>👔</span>
                        </div>
                      </div>
                    </div>

                    {log.details.notes && (
                      <div className="w-full md:w-auto md:max-w-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-500 italic">"{log.details.notes}"</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'damage' && (
            <div className="space-y-10">
              <div className="bg-slate-900 p-8 rounded-[3rem] relative flex flex-col items-center border-8 border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950"></div>

                <div ref={damageCanvasRef} onClick={handleAddDamage} className="relative w-full max-w-2xl cursor-crosshair z-10 transition-transform active:scale-[0.98]">
                  {/* SVG Silueta de Auto Robusta */}
                  <svg viewBox="0 0 800 400" className="w-full h-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <path d="M150,100 L650,100 C700,100 720,120 720,150 L720,250 C720,280 700,300 650,300 L150,300 C100,300 80,280 80,250 L80,150 C80,120 100,100 150,100" fill="#1e293b" stroke="#3b82f6" strokeWidth="6" />
                    <rect x="230" y="115" width="300" height="170" rx="20" fill="#0f172a" stroke="#475569" strokeWidth="3" />
                    <path d="M300,115 L300,285 M460,115 L460,285" stroke="#475569" strokeWidth="2" />
                    <text x="400" y="210" fill="#334155" textAnchor="middle" className="text-2xl font-black uppercase tracking-[0.5em] pointer-events-none">ETERNADRIVE</text>
                  </svg>

                  {tempDamage && (
                    <div className="absolute" style={{ left: `${tempDamage.x}%`, top: `${tempDamage.y}%` }}>
                      <div className="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 animate-bounce"></div>
                    </div>
                  )}

                  {(vehicle.damagePoints || []).map(point => (
                    <div key={point.id} className="absolute group/point" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                      <div className="w-8 h-8 bg-red-600 border-4 border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 animate-pulse cursor-pointer"></div>
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl text-[10px] font-black uppercase opacity-0 group-hover/point:opacity-100 transition-all w-40 z-20 border border-slate-100 text-center">
                        {point.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {tempDamage && (
                <div className="p-8 bg-blue-50 rounded-[2rem] border-2 border-blue-100 flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block">Descripción del daño</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-4 bg-white border-2 border-blue-200 rounded-2xl outline-none font-bold" placeholder="Ej: Rayón en guardabarros..." autoFocus />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTempDamage(null)} className="px-6 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
                    <button onClick={handleSaveDamage} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Registrar Punto</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(vehicle.damagePoints || []).map(point => (
                  <div key={point.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><ICONS.Damage className="w-5 h-5" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{point.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(point.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDamageId(point.id);
                        setRepairCostInput('');
                        setRepairNotesInput('');
                        setShowRepairModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                      REPARADO ✅
                    </button>
                  </div>
                ))}
              </div>

              {/* History Section */}
              {vehicle.damageHistory && vehicle.damageHistory.length > 0 && (
                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 uppercase mb-6 flex items-center gap-2">
                    <span className="text-2xl">📜</span> Historial de Reparaciones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicle.damageHistory.map(hist => (
                      <div key={hist.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-1 bg-slate-200 text-slate-500 text-[8px] font-black uppercase rounded-lg">Reparado</span>
                          <span className="text-[9px] font-bold text-slate-400">{new Date(hist.repairedDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-black text-slate-700 uppercase mb-1">{hist.description}</p>
                        <div className="text-[9px] text-slate-400 font-medium">
                          <p>Reparado por: <span className="font-bold text-slate-600">{hist.repairedBy || 'N/A'}</span></p>
                          <p>Reportado: {new Date(hist.reportedDate).toLocaleDateString()}</p>
                          {hist.repairCost && hist.repairCost > 0 && (
                            <p className="mt-1 text-emerald-600 font-black">Costo: ${hist.repairCost?.toLocaleString()}</p>
                          )}
                          {hist.repairNotes && (
                            <p className="mt-1 italic text-slate-500">"{hist.repairNotes}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          )
          }

          {activeTab === 'fuel' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-center">
                <div>
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registro de Combustible</h4>
                  <p className="text-slate-500 font-bold text-xs uppercase mt-1">Historial de cargas y consumo</p>
                </div>
              </header>

              {(logs.filter(l => l.type === CheckType.FUEL).length === 0) ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sin registros de combustible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {logs.filter(l => l.type === CheckType.FUEL).map(log => (
                    <div key={log.id} className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30">⛽</div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">{new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <span>👤 {log.userName}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>📟 {log.mileage.toLocaleString()} km</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end bg-white/50 p-4 rounded-2xl border border-amber-100/50">
                        <div className="text-center">
                          <p className="text-[9px] font-black text-amber-600 uppercase mb-0.5">Litros</p>
                          <p className="text-lg font-black text-slate-900">{log.details.fuelLiters?.toFixed(1) || '0.0'}</p>
                        </div>
                        <div className="w-px h-8 bg-amber-200"></div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-amber-600 uppercase mb-0.5">Costo</p>
                          <p className="text-lg font-black text-slate-900">${log.details.fuelCost?.toLocaleString() || '0'}</p>
                        </div>
                      </div>

                      {log.details.ticketPhoto && (
                        <div className="w-full md:w-auto mt-2 md:mt-0">
                          <button
                            onClick={() => window.open(log.details.ticketPhoto, '_blank')}
                            className="w-full md:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                          >
                            <span>🧾</span> Ver Ticket
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Otros tabs se mantienen igual... */}
          {
            activeTab === 'docs' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex justify-between items-center">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Carpeta Digital</h4>
                    <p className="text-slate-500 font-bold text-xs uppercase mt-1">Gestión de vencimientos y comprobantes</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* VTV Card */}
                  <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${vehicle.vtvExpiry && new Date(vehicle.vtvExpiry) < new Date()
                    ? 'bg-red-50 border-red-100 shadow-xl shadow-red-100'
                    : 'bg-white border-slate-100 shadow-sm'
                    }`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${vehicle.vtvExpiry && new Date(vehicle.vtvExpiry) < new Date() ? 'bg-red-500 text-white' : 'bg-slate-100'
                        }`}>🚦</div>
                      <div>
                        <h5 className="font-black text-slate-900 uppercase text-lg">VTV / RTO</h5>
                        <p className={`text-[10px] font-bold uppercase ${vehicle.vtvExpiry && new Date(vehicle.vtvExpiry) < new Date() ? 'text-red-500' : 'text-slate-400'
                          }`}>
                          {vehicle.vtvExpiry && new Date(vehicle.vtvExpiry) < new Date() ? 'Vencida - Circular con precaución' : 'Habilitación Técnica'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pointer-events-none">Fecha de Vencimiento</label>
                        <div className="relative">
                          <input
                            type="date"
                            id="vtv-datepicker"
                            value={vehicle.vtvExpiry ? vehicle.vtvExpiry.split('T')[0] : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                // Crear fecha usando UTC para evitar problemas de zona horaria
                                const [year, month, day] = val.split('-').map(Number);
                                // Ajustar a medio dia para evitar problemas de desfase
                                const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                                onUpdateVehicle({ ...vehicle, vtvExpiry: utcDate.toISOString() });
                              } else {
                                onUpdateVehicle({ ...vehicle, vtvExpiry: undefined });
                              }
                            }}
                            className="absolute opacity-0 w-0 h-0 overflow-hidden"
                            tabIndex={-1}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                const input = document.getElementById('vtv-datepicker') as HTMLInputElement;
                                if (input) {
                                  if ('showPicker' in HTMLInputElement.prototype) {
                                    input.showPicker();
                                  } else {
                                    input.click();
                                  }
                                }
                              } catch (e) { console.error(e); }
                            }}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 flex items-center justify-between hover:bg-slate-100 transition-colors"
                          >
                            <span>
                              {vehicle.vtvExpiry ? new Date(vehicle.vtvExpiry).toLocaleDateString() : 'Seleccionar Fecha'}
                            </span>
                            <span className="text-xl">📅</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pointer-events-none">Oblea / Certificado</label>
                      <label className="w-full flex items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                onUpdateVehicle({ ...vehicle, vtvPhoto: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <span className="text-slate-500 font-bold uppercase text-xs flex items-center gap-2">
                          📷 SUBIR DOCUMENTO (IMG/PDF)
                        </span>
                      </label>
                    </div>
                    {vehicle.vtvPhoto && (
                      <div className="mt-4 relative group">
                        <div className="h-40 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer" onClick={() => {
                          if (vehicle.vtvPhoto) {
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(
                                vehicle.vtvPhoto.startsWith('data:application/pdf')
                                  ? `<iframe src="${vehicle.vtvPhoto}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                  : `<img src="${vehicle.vtvPhoto}" style="max-width: 100%; height: auto;">`
                              );
                            }
                          }
                        }}>
                          {vehicle.vtvPhoto.startsWith('data:application/pdf') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-red-500">
                              <span className="text-4xl">📄</span>
                              <span className="text-xs font-bold mt-2 uppercase">Documento PDF</span>
                            </div>
                          ) : (
                            <img src={vehicle.vtvPhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-xs uppercase">Ver Documento</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onUpdateVehicle({ ...vehicle, vtvPhoto: undefined })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Insurance Card */}
                  <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date()
                    ? 'bg-red-50 border-red-100 shadow-xl shadow-red-100'
                    : 'bg-white border-slate-100 shadow-sm'
                    }`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? 'bg-red-500 text-white' : 'bg-blue-50'
                        }`}>🛡️</div>
                      <div>
                        <h5 className="font-black text-slate-900 uppercase text-lg">Seguro Automotor</h5>
                        <p className={`text-[10px] font-bold uppercase ${vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? 'text-red-500' : 'text-slate-400'
                          }`}>
                          {vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < new Date() ? 'Póliza Vencida' : 'Cobertura Vigente'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pointer-events-none">Vencimiento Póliza</label>
                        <div className="relative">
                          <input
                            type="date"
                            id="insurance-datepicker"
                            value={vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                // Crear fecha usando UTC para evitar problemas de zona horaria
                                const [year, month, day] = val.split('-').map(Number);
                                const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                                onUpdateVehicle({ ...vehicle, insuranceExpiry: utcDate.toISOString() });
                              } else {
                                onUpdateVehicle({ ...vehicle, insuranceExpiry: undefined });
                              }
                            }}
                            className="absolute opacity-0 w-0 h-0 overflow-hidden"
                            tabIndex={-1}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                const input = document.getElementById('insurance-datepicker') as HTMLInputElement;
                                if (input) {
                                  if ('showPicker' in HTMLInputElement.prototype) {
                                    try {
                                      input.showPicker();
                                    } catch (err) {
                                      input.click();
                                    }
                                  } else {
                                    input.click();
                                  }
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 flex items-center justify-between hover:bg-slate-100 transition-colors"
                          >
                            <span>
                              {vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString() : 'Seleccionar Vencimiento'}
                            </span>
                            <span className="text-xl">📅</span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pointer-events-none">Póliza / Tarjeta</label>
                        <label className="w-full flex items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  onUpdateVehicle({ ...vehicle, insurancePolicy: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <span className="text-slate-500 font-bold uppercase text-xs flex items-center gap-2">
                            📷 SUBIR DOCUMENTO (IMG/PDF)
                          </span>
                        </label>
                      </div>
                      {vehicle.insurancePolicy && (
                        <div className="mt-4 relative group">
                          <div className="h-40 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer" onClick={() => {
                            if (vehicle.insurancePolicy) {
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(
                                  vehicle.insurancePolicy.startsWith('data:application/pdf')
                                    ? `<iframe src="${vehicle.insurancePolicy}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                    : `<img src="${vehicle.insurancePolicy}" style="max-width: 100%; height: auto;">`
                                );
                              }
                            }
                          }}>
                            {vehicle.insurancePolicy.startsWith('data:application/pdf') ? (
                              <div className="w-full h-full flex flex-col items-center justify-center text-red-500">
                                <span className="text-4xl">📄</span>
                                <span className="text-xs font-bold mt-2 uppercase">Documento PDF</span>
                              </div>
                            ) : (
                              <img src={vehicle.insurancePolicy} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white font-bold text-xs uppercase">Ver Documento</span>
                            </div>
                          </div>
                          <button
                            onClick={() => onUpdateVehicle({ ...vehicle, insurancePolicy: undefined })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {
            activeTab === 'services' && (
              <div className="space-y-6">
                <h4 className="text-2xl font-black text-slate-900 uppercase">Historial de Taller Mecánico</h4>
                {logs.filter(l => l.type === CheckType.SERVICE).map(log => (
                  <div key={log.id} className="p-10 bg-violet-50 border-2 border-violet-100 rounded-[3rem] flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-violet-600 shadow-sm"><ICONS.Settings className="w-10 h-10" /></div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 uppercase">Service Completo</p>
                        <p className="text-sm font-black text-violet-600 uppercase">{log.details.workshopName || 'Taller Oficial'}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">{new Date(log.timestamp).toLocaleDateString()} • {log.mileage.toLocaleString()} KM</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-slate-900">${log.details.serviceCost?.toLocaleString()}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Costo Invertido</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div >
      </div >

      {
        showLogForm && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
            <div className="bg-slate-50 w-full max-w-2xl rounded-t-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden my-auto relative max-h-screen md:my-8">

              {/* Header Sticky */}
              <header className="px-4 sm:px-6 md:px-8 py-4 md:py-6 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 md:gap-3">
                  {logType === CheckType.SERVICE ? <span className="text-xl md:text-2xl">🛠️</span> : <span className="text-xl md:text-2xl">📋</span>}
                  <span className="hidden sm:inline">{logType === CheckType.SERVICE ? 'Nuevo Service' : 'Control Semanal'}</span>
                  <span className="sm:hidden">{logType === CheckType.SERVICE ? 'Service' : 'Control'}</span>
                </h3>
                <button
                  onClick={() => setShowLogForm(false)}
                  className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all font-black text-xl"
                >×</button>
              </header>

              <div className="max-h-[calc(100vh-140px)] md:max-h-[80vh] overflow-y-auto p-4 sm:p-6 md:p-8 pb-32 md:pb-6 space-y-6 md:space-y-8">
                <form onSubmit={handleSubmitLog} className="space-y-6 md:space-y-8">

                  {logType === CheckType.FUEL && (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in zoom-in-95 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-amber-50 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-amber-100">
                          <label className="text-[10px] font-black text-amber-600 uppercase block mb-3 pl-2">Litros Cargados</label>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">⛽</span>
                            <input required type="number" step="0.01" value={fuelLiters} onChange={e => setFuelLiters(e.target.value)} className="w-full bg-transparent text-xl md:text-2xl font-black outline-none text-slate-900 placeholder:text-amber-200 min-h-[44px]" placeholder="0.00" />
                          </div>
                        </div>
                        <div className="bg-slate-100 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200">
                          <label className="text-[10px] font-black text-slate-500 uppercase block mb-3 pl-2">Costo Total ($)</label>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl text-slate-400">$</span>
                            <input required type="number" step="0.01" value={fuelCost} onChange={e => setFuelCost(e.target.value)} className="w-full bg-transparent text-xl md:text-2xl font-black outline-none text-slate-900 placeholder:text-slate-300 min-h-[44px]" placeholder="0.00" />
                          </div>
                        </div>
                        <div className="col-span-1 md:col-span-2 bg-slate-50 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100">
                          <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-2">Foto del Ticket</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handlePhotoUpload}
                              className="hidden"
                              id="ticket-photo-upload"
                            />
                            <label
                              htmlFor="ticket-photo-upload"
                              className="flex items-center justify-center gap-3 w-full p-5 md:p-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors min-h-[56px]"
                            >
                              <span className="text-2xl">📸</span>
                              <span className="text-xs md:text-sm font-bold text-slate-600 uppercase">
                                {ticketPhoto ? 'Cambiar Foto' : 'Tomar Foto'}
                              </span>
                            </label>
                          </div>
                          {ticketPhoto && (
                            <div className="mt-4 relative h-48 rounded-2xl overflow-hidden border border-slate-200">
                              <img src={ticketPhoto} alt="Ticket" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setTicketPhoto('')}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg min-h-[44px] min-w-[44px]"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {logType === CheckType.SERVICE && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in zoom-in-95 duration-300">
                      <div className="bg-violet-50 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-violet-100">
                        <label className="text-[10px] font-black text-violet-600 uppercase block mb-3 pl-2">Taller Mecánico</label>
                        <input required type="text" value={workshopName} onChange={e => setWorkshopName(e.target.value)} className="w-full bg-white p-4 md:p-4 rounded-xl md:rounded-2xl text-base md:text-lg font-black outline-none border-2 border-transparent focus:border-violet-300 transition-all text-slate-900 placeholder:text-slate-300 min-h-[56px]" placeholder="Nombre del taller..." />
                      </div>
                      <div className="bg-slate-100 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-3 pl-2">Costo Total ($)</label>
                        <input required type="number" value={serviceCost} onChange={e => setServiceCost(e.target.value)} className="w-full bg-white p-4 md:p-4 rounded-xl md:rounded-2xl text-base md:text-lg font-black outline-none border-2 border-transparent focus:border-slate-300 transition-all text-slate-900 min-h-[56px]" placeholder="0.00" />
                      </div>
                    </div>
                  )}

                  {logType === CheckType.WEEKLY_SAFETY && (
                    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom duration-500">

                      {/* Tarjeta: Neumáticos */}
                      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h4 className="flex items-center gap-2 md:gap-3 text-xs font-black text-slate-900 uppercase tracking-widest mb-4 md:mb-6 border-b border-slate-50 pb-3 md:pb-4">
                          <span className="text-lg">🚗</span> Neumáticos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-[1.5rem] border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Presión (PSI)</label>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">💨</span>
                              <input type="number" value={tirePressure} onChange={e => setTirePressure(e.target.value)} className="w-full bg-transparent text-xl md:text-2xl font-black outline-none text-slate-900 min-h-[44px]" placeholder="30" />
                            </div>
                          </div>
                          <StatusToggle label="Rueda de Auxilio" value={spareTireOk} onChange={setSpareTireOk} />
                        </div>
                      </div>

                      {/* Tarjeta: Niveles de Fluidos */}
                      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h4 className="flex items-center gap-2 md:gap-3 text-xs font-black text-slate-900 uppercase tracking-widest mb-4 md:mb-6 border-b border-slate-50 pb-3 md:pb-4">
                          <span className="text-lg">💧</span> Niveles de Fluidos
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FluidControl label="Aceite Motor" icon="🛢️" value={oilLevel} onChange={setOilLevel} />
                          <FluidControl label="Refrigerante" icon="❄️" value={coolantLevel} onChange={setCoolantLevel} />
                          <FluidControl label="Líquido Frenos" icon="🛑" value={brakeLevel} onChange={setBrakeLevel} />
                          <FluidControl label="Limpiaparabrisas" icon="🚿" value={wiperLevel} onChange={setWiperLevel} />
                        </div>
                      </div>

                      {/* Tarjeta: Control General */}
                      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h4 className="flex items-center gap-2 md:gap-3 text-xs font-black text-slate-900 uppercase tracking-widest mb-4 md:mb-6 border-b border-slate-50 pb-3 md:pb-4">
                          <span className="text-lg">⚡</span> Control General
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <StatusToggle label="Luces (Todas)" value={lightsOk} onChange={setLightsOk} />
                          <StatusToggle label="Bocina" value={hornOk} onChange={setHornOk} />
                          <StatusToggle label="Carga Matafuegos" value={fireExtOk} onChange={setFireExtOk} />
                          <div className={`p-4 md:p-5 rounded-xl md:rounded-[1.5rem] border transition-colors ${fireExtExpiry && new Date(fireExtExpiry) < new Date()
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-100'
                            }`}>
                            <label className={`text-[9px] font-black uppercase block mb-2 ${fireExtExpiry && new Date(fireExtExpiry) < new Date() ? 'text-red-500' : 'text-slate-400'
                              }`}>
                              {fireExtExpiry && new Date(fireExtExpiry) < new Date() ? '⛔ VENCIDO' : 'Vencimiento Matafuegos'}
                            </label>
                            <input
                              type="date"
                              value={fireExtExpiry}
                              onChange={e => setFireExtExpiry(e.target.value)}
                              className={`w-full bg-transparent text-sm md:text-base font-bold outline-none min-h-[44px] ${fireExtExpiry && new Date(fireExtExpiry) < new Date() ? 'text-red-600' : 'text-slate-900'
                                }`}
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Footer Común */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-4 border-t border-slate-200/60">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-2">Kilometraje Actual</label>
                      <div className="relative">
                        <input required type="number" value={newMileage} onChange={e => setNewMileage(e.target.value)} className="w-full p-4 pl-12 bg-slate-900 text-white rounded-xl md:rounded-2xl text-lg md:text-xl font-black outline-none shadow-lg min-h-[56px]" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📟</span>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-2">Observaciones</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl min-h-[56px] focus:border-blue-300 transition-all outline-none font-medium resize-none text-sm shadow-sm" placeholder="Escribe aquí..." />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-5 md:py-6 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-sm md:text-base shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[56px]">
                    Guardar Registro
                  </button>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Tires Tab */}
      {activeTab === 'tires' && (
        <TireManagement vehicle={vehicle} onUpdateVehicle={onUpdateVehicle} />
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <TimelineView vehicle={vehicle} currentUser={currentUser} />
      )}

      {/* Repair Modal */}
      {showRepairModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8">
              <h3 className="text-xl font-black text-slate-900 uppercase mb-2 flex items-center gap-2">
                <span>✅</span> Confirmar Reparación
              </h3>
              <p className="text-slate-500 font-medium text-sm mb-6">Detalla el costo y observaciones de la reparación para el historial.</p>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-2">Costo Total ($)</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xl text-slate-400">$</span>
                    <input
                      type="number"
                      value={repairCostInput}
                      onChange={(e) => setRepairCostInput(e.target.value)}
                      className="w-full bg-transparent text-xl font-black outline-none text-slate-900"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 pl-2">Notas / Observaciones</label>
                  <textarea
                    value={repairNotesInput}
                    onChange={(e) => setRepairNotesInput(e.target.value)}
                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium text-sm outline-none resize-none h-24"
                    placeholder="Ej: Cambio de paragolpes y pintura..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => setShowRepairModal(false)}
                    className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmRepair}
                    className="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const TimelineView: React.FC<{ vehicle: Vehicle, currentUser: User }> = ({ vehicle, currentUser }) => {
  const [notes, setNotes] = useState<VehicleNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [type, setType] = useState('GENERAL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    fetchNotes();
  }, [vehicle.id]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/notes`);
      if (res.ok) {
        setNotes(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, type, cost, date,
          createdBy: currentUser.name
        })
      });
      if (res.ok) {
        setShowForm(false);
        setTitle('');
        setDescription('');
        setCost('');
        fetchNotes();
      }
    } catch (e) {
      alert('Error al guardar nota');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Bitácora de Eventos</h4>
          <p className="text-slate-500 font-bold text-xs uppercase mt-1">Historial cronológico completo</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <span>+</span> Nueva Nota
        </button>
      </header>

      {showForm && (
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 animate-in fade-in zoom-in-95">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Título</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-bold text-sm outline-none" placeholder="Ej: Cambio de Batería" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Tipo de Evento</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-bold text-sm outline-none text-slate-600">
                  <option value="GENERAL">General</option>
                  <option value="CLEANING">Limpieza / Lavado</option>
                  <option value="ACCESSORY">Accesorio / Equipamiento</option>
                  <option value="FINE">Multa / Infracción</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Costo ($)</label>
                <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-bold text-sm outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-bold text-sm outline-none text-slate-600" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 pl-2">Descripción Detallada</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none shadow-sm font-medium text-sm outline-none resize-none h-20" placeholder="Detalles adicionales..." />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-emerald-600">Guardar Evento</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative border-l-2 border-slate-100 pl-8 ml-4 space-y-8 py-4">
        {loading ? <p className="text-slate-400 font-bold text-xs uppercase">Cargando bitácora...</p> : (
          <>
            {/* Custom Notes */}
            {notes.map(note => (
              <div key={note.id} className="relative bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="absolute -left-[41px] top-6 w-5 h-5 rounded-full bg-blue-500 border-4 border-slate-50 shadow-sm"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">{note.type}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(note.date).toLocaleDateString()}</span>
                </div>
                <h5 className="font-black text-slate-900 uppercase text-sm mb-1">{note.title}</h5>
                <p className="text-xs text-slate-500 font-medium mb-3">{note.description}</p>

                <div className="flex items-center gap-4 border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Costo:</span>
                    <span className="text-xs font-black text-slate-900">${note.cost?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Por:</span>
                    <span className="text-xs font-bold text-slate-600">{note.createdBy || 'Sistema'}</span>
                  </div>
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No hay eventos registrados</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleDetail;
