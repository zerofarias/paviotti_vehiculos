
import React from 'react';
import { UserRole } from '../types';
import type { MaintenanceConfig, User } from '../types';
import { ICONS } from '../constants';

interface SettingsProps {
  config: MaintenanceConfig;
  setConfig: React.Dispatch<React.SetStateAction<MaintenanceConfig>>;
  user: User;
}

const Settings: React.FC<SettingsProps> = ({ config, setConfig, user }) => {
  const handleUpdate = (field: keyof MaintenanceConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="text-center py-20">
        <ICONS.Alert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Acceso Restringido</h3>
        <p className="text-slate-500">Solo administradores pueden modificar la configuración del sistema.</p>
      </div>
    );
  }

  const Toggle = ({ label, value, onToggle }: { label: string, value: boolean, onToggle: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
      <button
        onClick={() => onToggle(!value)}
        className={`w-12 h-6 rounded-full relative transition-all ${value ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? 'right-1' : 'left-1'}`}></div>
      </button>
    </div>
  );

  return (
    <div className="w-full space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Configuración del Sistema</h2>
        <p className="text-slate-500 font-medium">Ajusta los parámetros de control y notificaciones automáticas.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Intervalos de Mantenimiento */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <ICONS.Settings className="text-blue-600" />
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter">Intervalos de Flota</h3>
          </div>
          <div className="p-8 space-y-6 flex-1">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service cada (KM)</label>
                <input
                  type="number"
                  value={config.serviceKmInterval}
                  onChange={(e) => handleUpdate('serviceKmInterval', parseInt(e.target.value))}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service cada (Meses)</label>
                <input
                  type="number"
                  value={config.serviceMonthInterval}
                  onChange={(e) => handleUpdate('serviceMonthInterval', parseInt(e.target.value))}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cambio Neumáticos (KM)</label>
                <input
                  type="number"
                  value={config.tireChangeKmInterval}
                  onChange={(e) => handleUpdate('tireChangeKmInterval', parseInt(e.target.value))}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Intervalo Control (Días)</label>
              <input
                type="number"
                value={config.checkIntervalDays}
                onChange={(e) => handleUpdate('checkIntervalDays', parseInt(e.target.value))}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black"
              />
            </div>
          </div>
        </section>

        {/* Alertas y Notificaciones */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <ICONS.Alert className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter">Alertas Automáticas</h3>
          </div>
          <div className="p-8 space-y-6 flex-1">
            <div className="space-y-3">
              <Toggle label="Activar Alertas Email" value={config.enableEmailAlerts} onToggle={(v) => handleUpdate('enableEmailAlerts', v)} />
              <Toggle label="Aviso de Service" value={config.alertOnService} onToggle={(v) => handleUpdate('alertOnService', v)} />
              <Toggle label="Vencimiento Licencias" value={config.alertOnLicense} onToggle={(v) => handleUpdate('alertOnLicense', v)} />
              <Toggle label="Vencimiento Matafuegos" value={config.alertOnFireExtinguisher} onToggle={(v) => handleUpdate('alertOnFireExtinguisher', v)} />
            </div>

            {config.enableEmailAlerts && (
              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4 animate-in slide-in-from-top">
                <div>
                  <label className="block text-[9px] font-black text-blue-600 uppercase mb-1">Emails Destinatarios (Separados por coma)</label>
                  <input
                    type="text"
                    value={config.notificationEmails || ''}
                    onChange={(e) => handleUpdate('notificationEmails', e.target.value)}
                    placeholder="jefe@paviotti.com, admin@paviotti.com"
                    className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs font-bold outline-none"
                  />
                  <p className="text-[8px] text-blue-400 font-bold mt-1 pl-1">Estos correos recibirán las alertas automáticas.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-black text-blue-400 uppercase mb-1">Servidor SMTP</label>
                    <input
                      type="text"
                      value={config.smtpServer}
                      onChange={(e) => handleUpdate('smtpServer', e.target.value)}
                      className="w-full p-2 bg-white border border-blue-100 rounded-lg text-[10px] font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-blue-400 uppercase mb-1">Usuario SMTP</label>
                    <input
                      type="text"
                      value={config.smtpUser}
                      onChange={(e) => handleUpdate('smtpUser', e.target.value)}
                      className="w-full p-2 bg-white border border-blue-100 rounded-lg text-[10px] font-medium outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div >

      <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <ICONS.Check className="w-10 h-10" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-xl font-black uppercase tracking-tight">Sistema de Notificaciones Paviotti</h4>
          <p className="text-slate-400 text-sm font-medium mt-1">El sistema verificará cada 24 horas los vencimientos y enviará un resumen PDF al correo configurado si se detectan anomalías.</p>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
              });
              if (res.ok) {
                alert('Configuración guardada correctamente');
              } else {
                alert('Error al guardar la configuración');
              }
            } catch (e) {
              console.error(e);
              alert('Error al conectar con el servidor');
            }
          }}
          className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
        >
          Guardar Todo
        </button>
      </div>
    </div >
  );
};

export default Settings;
