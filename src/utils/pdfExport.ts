import type { CheckLog, Vehicle } from '../types';

// Utilidad para exportar reportes a PDF sin dependencias pesadas
// Usaremos una estrategia simple: generar un HTML y abrirlo para imprimir

export const exportVehicleInspectionToPDF = (vehicle: Vehicle, log: CheckLog) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Control de Inspección - ${vehicle.plate}</title>
      <style>
        @media print {
          @page { margin: 2cm; }
          body { margin: 0; }
        }
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #1e293b;
        }
        .header {
          border-bottom: 4px solid #1e293b;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .document-title {
          font-size: 20px;
          color: #64748b;
          margin-top: 10px;
        }
        .vehicle-info {
          background: #f1f5f9;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .vehicle-plate {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          background: #1e293b;
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .info-item {
          padding: 10px;
          background: white;
          border-radius: 8px;
        }
        .info-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #94a3b8;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .info-value {
          font-size: 16px;
          font-weight: bold;
          margin-top: 5px;
        }
        .inspection-details {
          margin-top: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .check-item {
          padding: 12px 15px;
          border-left: 4px solid #10b981;
          background: #f0fdf4;
          margin-bottom: 10px;
          border-radius: 4px;
        }
        .check-item.warning {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }
        .check-item.danger {
          border-left-color: #ef4444;
          background: #fef2f2;
        }
        .check-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: bold;
        }
        .check-value {
          font-size: 14px;
          margin-top: 4px;
        }
        .signature-section {
          margin-top: 50px;
          border-top: 2px solid #e2e8f0;
          padding-top: 30px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .signature-box {
          text-align: center;
        }
        .signature-line {
          border-top: 2px solid #1e293b;
          margin-top: 60px;
          padding-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .badge-success {
          background: #10b981;
          color: white;
        }
        .badge-warning {
          background: #f59e0b;
          color: white;
        }
        .badge-danger {
          background: #ef4444;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Paviotti Fleet Management</div>
        <div class="document-title">Reporte de ${log.type === 'WEEKLY_SAFETY' ? 'Control Semanal' : log.type === 'SERVICE' ? 'Service de Taller' : 'Inspección'}</div>
      </div>

      <div class="vehicle-info">
        <div class="vehicle-plate">${vehicle.plate}</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Marca y Modelo</div>
            <div class="info-value">${vehicle.brand} ${vehicle.model}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Año</div>
            <div class="info-value">${vehicle.year}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Kilometraje</div>
            <div class="info-value">${log.mileage.toLocaleString()} KM</div>
          </div>
          <div class="info-item">
            <div class="info-label">Fecha de Inspección</div>
            <div class="info-value">${new Date(log.timestamp).toLocaleDateString('es-AR')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Inspector</div>
            <div class="info-value">${log.userName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Hora</div>
            <div class="info-value">${new Date(log.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      <div class="inspection-details">
        <div class="section-title">Detalles de Inspección</div>
        
        ${log.details.tirePressurePsi ? `
        <div class="check-item">
          <div class="check-label">Presión de Neumáticos</div>
          <div class="check-value">${log.details.tirePressurePsi} PSI <span class="badge badge-success">Normal</span></div>
        </div>
        ` : ''}

        ${log.details.oilLevel ? `
        <div class="check-item ${log.details.oilLevel === 'low' ? 'warning' : ''}">
          <div class="check-label">Nivel de Aceite</div>
          <div class="check-value">${log.details.oilLevel === 'low' ? 'BAJO - Requiere atención' : 'Normal'} 
            <span class="badge ${log.details.oilLevel === 'low' ? 'badge-warning' : 'badge-success'}">
              ${log.details.oilLevel === 'low' ? 'Bajo' : 'Normal'}
            </span>
          </div>
        </div>
        ` : ''}

        ${log.details.coolantLevel ? `
        <div class="check-item ${log.details.coolantLevel === 'low' ? 'warning' : ''}">
          <div class="check-label">Nivel de Refrigerante</div>
          <div class="check-value">${log.details.coolantLevel === 'low' ? 'BAJO - Requiere atención' : 'Normal'}
            <span class="badge ${log.details.coolantLevel === 'low' ? 'badge-warning' : 'badge-success'}">
              ${log.details.coolantLevel === 'low' ? 'Bajo' : 'Normal'}
            </span>
          </div>
        </div>
        ` : ''}

        ${log.details.brakeFluidLevel ? `
        <div class="check-item ${log.details.brakeFluidLevel === 'low' ? 'danger' : ''}">
          <div class="check-label">Líquido de Frenos</div>
          <div class="check-value">${log.details.brakeFluidLevel === 'low' ? '⚠️ BAJO - CRÍTICO' : 'Normal'}
            <span class="badge ${log.details.brakeFluidLevel === 'low' ? 'badge-danger' : 'badge-success'}">
              ${log.details.brakeFluidLevel === 'low' ? 'Crítico' : 'Normal'}
            </span>
          </div>
        </div>
        ` : ''}

        ${log.details.lightsOk !== undefined ? `
        <div class="check-item ${!log.details.lightsOk ? 'warning' : ''}">
          <div class="check-label">Sistema de Luces</div>
          <div class="check-value">${log.details.lightsOk ? 'Funcionando correctamente' : 'Requiere revisión'}
            <span class="badge ${log.details.lightsOk ? 'badge-success' : 'badge-warning'}">
              ${log.details.lightsOk ? 'OK' : 'Revisar'}
            </span>
          </div>
        </div>
        ` : ''}

        ${log.details.fireExtinguisherOk !== undefined ? `
        <div class="check-item ${!log.details.fireExtinguisherOk ? 'danger' : ''}">
          <div class="check-label">Matafuegos</div>
          <div class="check-value">${log.details.fireExtinguisherOk ? 'En regla' : '⚠️ VENCIDO O FALTANTE'}
            ${log.details.fireExtinguisherExpiry ? `<br>Vencimiento: ${new Date(log.details.fireExtinguisherExpiry).toLocaleDateString('es-AR')}` : ''}
            <span class="badge ${log.details.fireExtinguisherOk ? 'badge-success' : 'badge-danger'}">
              ${log.details.fireExtinguisherOk ? 'OK' : 'Crítico'}
            </span>
          </div>
        </div>
        ` : ''}

        ${log.details.notes ? `
        <div class="check-item">
          <div class="check-label">Observaciones</div>
          <div class="check-value">${log.details.notes}</div>
        </div>
        ` : ''}

        ${log.type === 'SERVICE' && log.details.serviceCost ? `
        <div class="check-item">
          <div class="check-label">Costo del Service</div>
          <div class="check-value" style="font-size: 20px; font-weight: bold; color: #8b5cf6;">
            $${log.details.serviceCost.toLocaleString()}
          </div>
        </div>
        <div class="check-item">
          <div class="check-label">Taller</div>
          <div class="check-value">${log.details.workshopName || 'Taller Oficial'}</div>
        </div>
        ` : ''}
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">
            <strong>${log.userName}</strong><br>
            Inspector
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            <strong>Supervisor</strong><br>
            Gerencia / Responsable
          </div>
        </div>
      </div>

      <div class="footer">
        Documento generado automáticamente por Paviotti Fleet Management System<br>
        ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
};

// Exportar reporte de historial de vehículo
export const exportVehicleHistoryToPDF = (vehicle: Vehicle, logs: CheckLog[]) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Historial Completo - ${vehicle.plate}</title>
      <style>
        /* Mismos estilos que arriba */
        @media print {
          @page { margin: 2cm; }
          body { margin: 0; }
        }
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #1e293b;
        }
        .header {
          border-bottom: 4px solid #1e293b;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .document-title {
          font-size: 20px;
          color: #64748b;
          margin-top: 10px;
        }
        .vehicle-plate {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          background: #1e293b;
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        .log-entry {
          page-break-inside: avoid;
          margin-bottom: 20px;
          padding: 15px;
          border-left: 4px solid #3b82f6;
          background: #f8fafc;
          border-radius: 4px;
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .log-type {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 14px;
        }
        .log-date {
          color: #64748b;
          font-size: 12px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Paviotti Fleet Management</div>
        <div class="document-title">Historial Completo del Vehículo</div>
      </div>

      <div class="vehicle-plate">${vehicle.plate}</div>

      <p style="text-align: center; color: #64748b; margin-bottom: 30px;">
        <strong>${vehicle.brand} ${vehicle.model}</strong> • Año ${vehicle.year}<br>
        ${logs.length} registros en total
      </p>

      ${logs.map(log => `
        <div class="log-entry">
          <div class="log-header">
            <span class="log-type">${log.type === 'WEEKLY_SAFETY' ? '✓ Control Semanal' : log.type === 'SERVICE' ? '🛠️ Service' : '⛽ Combustible'}</span>
            <span class="log-date">${new Date(log.timestamp).toLocaleDateString('es-AR')}</span>
          </div>
          <div>
            <strong>Inspector:</strong> ${log.userName}<br>
            <strong>Kilometraje:</strong> ${log.mileage.toLocaleString()} KM<br>
            ${log.details.notes ? `<strong>Notas:</strong> ${log.details.notes}<br>` : ''}
            ${log.details.serviceCost ? `<strong>Costo:</strong> $${log.details.serviceCost.toLocaleString()}<br>` : ''}
          </div>
        </div>
      `).join('')}

      <div class="footer">
        Documento generado automáticamente por Paviotti Fleet Management System<br>
        ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
};
