import React, { useMemo } from 'react';
import type { Vehicle, User, MaintenanceConfig } from '../types';

interface CriticalAlert {
    id: string;
    type: 'vehicle_vtv' | 'vehicle_insurance' | 'vehicle_service' | 'license' | 'fire_extinguisher';
    severity: 'critical' | 'warning';
    title: string;
    subtitle: string;
    icon: string;
    daysRemaining: number;
    relatedId: string;
}

interface AlertsDashboardProps {
    vehicles: Vehicle[];
    users: User[];
    config: MaintenanceConfig;
}

const AlertsDashboard: React.FC<AlertsDashboardProps> = ({ vehicles, users, config }) => {
    const alerts = useMemo(() => {
        const now = new Date();
        const allAlerts: CriticalAlert[] = [];

        // Check vehicle VTV
        vehicles.forEach(v => {
            if (v.vtvExpiry) {
                const expiryDate = new Date(v.vtvExpiry);
                const daysRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 30) {
                    allAlerts.push({
                        id: `vtv-${v.id}`,
                        type: 'vehicle_vtv',
                        severity: daysRemaining < 0 ? 'critical' : daysRemaining <= 15 ? 'critical' : 'warning',
                        title: `${v.plate} - VTV ${daysRemaining < 0 ? 'VENCIDA' : 'Por Vencer'}`,
                        subtitle: daysRemaining < 0 ? `Vencida hace ${Math.abs(daysRemaining)} días` : `Vence en ${daysRemaining} días`,
                        icon: '🚦',
                        daysRemaining,
                        relatedId: v.id
                    });
                }
            }
        });

        // Check vehicle insurance
        vehicles.forEach(v => {
            if (v.insuranceExpiry) {
                const expiryDate = new Date(v.insuranceExpiry);
                const daysRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 30) {
                    allAlerts.push({
                        id: `insurance-${v.id}`,
                        type: 'vehicle_insurance',
                        severity: daysRemaining < 0 ? 'critical' : daysRemaining <= 15 ? 'critical' : 'warning',
                        title: `${v.plate} - Seguro ${daysRemaining < 0 ? 'VENCIDO' : 'Por Vencer'}`,
                        subtitle: daysRemaining < 0 ? `Vencido hace ${Math.abs(daysRemaining)} días` : `Vence en ${daysRemaining} días`,
                        icon: '🛡️',
                        daysRemaining,
                        relatedId: v.id
                    });
                }
            }
        });

        // Check vehicle service needed
        vehicles.forEach(v => {
            const kmSinceService = v.currentMileage - v.lastServiceMileage;
            const dateLastService = new Date(v.lastServiceDate);
            const monthsSinceService = (now.getTime() - dateLastService.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

            if (kmSinceService >= config.serviceKmInterval || monthsSinceService >= config.serviceMonthInterval) {
                const kmOverdue = kmSinceService - config.serviceKmInterval;
                const monthsOverdue = monthsSinceService - config.serviceMonthInterval;

                allAlerts.push({
                    id: `service-${v.id}`,
                    type: 'vehicle_service',
                    severity: kmOverdue > 5000 || monthsOverdue > 2 ? 'critical' : 'warning',
                    title: `${v.plate} - Service Requerido`,
                    subtitle: kmOverdue > 0
                        ? `${kmOverdue.toLocaleString()} km de retraso`
                        : `${monthsOverdue.toFixed(1)} meses desde último service`,
                    icon: '🛠️',
                    daysRemaining: -Math.floor(monthsOverdue * 30),
                    relatedId: v.id
                });
            }
        });

        // Check user licenses
        users.forEach(u => {
            if (u.licenseExpiration) {
                const expiryDate = new Date(u.licenseExpiration);
                const daysRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 30) {
                    allAlerts.push({
                        id: `license-${u.id}`,
                        type: 'license',
                        severity: daysRemaining < 0 ? 'critical' : daysRemaining <= 15 ? 'critical' : 'warning',
                        title: `${u.name} - Licencia ${daysRemaining < 0 ? 'VENCIDA' : 'Por Vencer'}`,
                        subtitle: daysRemaining < 0 ? `Vencida hace ${Math.abs(daysRemaining)} días` : `Vence en ${daysRemaining} días`,
                        icon: '🪪',
                        daysRemaining,
                        relatedId: u.id
                    });
                }
            }
        });

        // Sort by severity and days remaining
        return allAlerts.sort((a, b) => {
            if (a.severity === 'critical' && b.severity !== 'critical') return -1;
            if (a.severity !== 'critical' && b.severity === 'critical') return 1;
            return a.daysRemaining - b.daysRemaining;
        });
    }, [vehicles, users, config]);

    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');

    if (alerts.length === 0) {
        return (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-3xl">✅</div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-emerald-900 uppercase">Todo en Orden</h3>
                        <p className="text-sm text-emerald-700 font-bold mt-1">No hay alertas ni vencimientos pendientes</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-[2rem] md:rounded-[3rem] p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🚨</span>
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-red-900 uppercase">Atención Inmediata</h3>
                            <p className="text-xs text-red-600 font-bold">{criticalAlerts.length} alerta{criticalAlerts.length > 1 ? 's' : ''} crítica{criticalAlerts.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {criticalAlerts.map(alert => (
                            <div key={alert.id} className="bg-white border border-red-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
                                <span className="text-3xl">{alert.icon}</span>
                                <div className="flex-1">
                                    <p className="font-black text-sm text-slate-900 uppercase">{alert.title}</p>
                                    <p className="text-xs text-red-600 font-bold">{alert.subtitle}</p>
                                </div>
                                {alert.daysRemaining < 0 && (
                                    <span className="px-3 py-1 bg-red-500 text-white font-black text-[10px] uppercase rounded-full">
                                        VENCIDO
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warning Alerts */}
            {warningAlerts.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] md:rounded-[3rem] p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-amber-900 uppercase">Próximos Vencimientos</h3>
                            <p className="text-xs text-amber-600 font-bold">{warningAlerts.length} alerta{warningAlerts.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {warningAlerts.map(alert => (
                            <div key={alert.id} className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
                                <span className="text-3xl">{alert.icon}</span>
                                <div className="flex-1">
                                    <p className="font-black text-sm text-slate-900 uppercase">{alert.title}</p>
                                    <p className="text-xs text-amber-600 font-bold">{alert.subtitle}</p>
                                </div>
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 font-black text-[10px] uppercase rounded-full">
                                    {alert.daysRemaining} días
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertsDashboard;
