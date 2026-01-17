import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Re-inicializar el servicio (útil para testing o cuando cambian env vars)
   */
  public reinitialize() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const emailEnabled = process.env.EMAIL_ALERTS_ENABLED === 'true';

    if (!emailEnabled) {
      console.log('📧 Envío de emails DESHABILITADO (EMAIL_ALERTS_ENABLED=false)');
      return;
    }

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      console.warn('⚠️  Configuración SMTP incompleta. Emails deshabilitados.');
      console.warn('   Configura: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true para puerto 465, false para otros
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });

      this.enabled = true;
      console.log(`✅ Servicio de email configurado: ${smtpUser}`);
    } catch (error) {
      console.error('❌ Error configurando servicio de email:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.log('📧 Email NO enviado (servicio deshabilitado)');
      return false;
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      await this.transporter.sendMail({
        from: `"Sistema de Flota Paviotti" <${process.env.SMTP_USER}>`,
        to: recipients,
        subject: options.subject,
        text: options.text || this.htmlToText(options.html),
        html: options.html
      });

      console.log(`✅ Email enviado a: ${recipients}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  private htmlToText(html: string): string {
    // Conversión básica de HTML a texto plano
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  /**
   * Template de email para alertas de VTV
   */
  vtvAlertEmail(data: {
    plate: string;
    brand: string;
    model: string;
    vtvExpiry: string;
    daysUntilExpiry: number;
    isExpired: boolean;
  }): { subject: string; html: string } {
    const isCritical = Math.abs(data.daysUntilExpiry) <= 7;
    const emoji = data.isExpired ? '⚠️' : (isCritical ? '🔴' : '🟡');
    const urgency = data.isExpired ? 'VENCIDA' : (isCritical ? 'URGENTE' : 'AVISO');

    return {
      subject: `${emoji} ${urgency}: VTV del vehículo ${data.plate}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: ${data.isExpired ? '#fee' : (isCritical ? '#fff3cd' : '#e7f3ff')}; border-left: 5px solid ${data.isExpired ? '#dc3545' : (isCritical ? '#ffc107' : '#0d6efd')}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .vehicle-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} Alerta de VTV</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0;">${urgency}: ${data.isExpired ? 'VTV VENCIDA' : 'VTV Próxima a Vencer'}</h2>
        <p style="font-size: 18px; margin: 10px 0;">
          ${data.isExpired
          ? `La VTV del vehículo <strong>${data.plate}</strong> está VENCIDA hace <strong>${Math.abs(data.daysUntilExpiry)} días</strong>.`
          : `La VTV del vehículo <strong>${data.plate}</strong> vence en <strong>${data.daysUntilExpiry} días</strong>.`
        }
        </p>
      </div>
      
      <div class="vehicle-info">
        <h3>Información del Vehículo:</h3>
        <p><strong>Patente:</strong> ${data.plate}</p>
        <p><strong>Marca:</strong> ${data.brand}</p>
        <p><strong>Modelo:</strong> ${data.model}</p>
        <p><strong>Vencimiento VTV:</strong> ${new Date(data.vtvExpiry).toLocaleDateString('es-AR')}</p>
      </div>

      <p><strong>Acción requerida:</strong></p>
      <ul>
        <li>${data.isExpired ? 'Programar VTV de forma INMEDIATA' : 'Programar turno para VTV'}</li>
        <li>Verificar disponibilidad en plantas verificadoras</li>
        <li>Preparar documentación necesaria</li>
      </ul>

      <a href="http://localhost:5173" class="btn">Ver en el Sistema</a>
    </div>
    
    <div class="footer">
      <p>Sistema de Gestión de Flota Paviotti<br>
      Este es un email automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
      `
    };
  }

  /**
   * Template de email para alertas de licencia
   */
  licenseAlertEmail(data: {
    userName: string;
    userEmail: string;
    licenseExpiration: string;
    daysExpired: number;
  }): { subject: string; html: string } {
    const emoji = data.daysExpired === 0 ? '🔴' : '⚠️';

    return {
      subject: `${emoji} ${data.daysExpired === 0 ? 'URGENTE' : 'CRÍTICO'}: Licencia de conducir ${data.daysExpired === 0 ? 'vence HOY' : 'VENCIDA'}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: #fee; border-left: 5px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🪪 Alerta de Licencia de Conducir</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0;">LICENCIA ${data.daysExpired === 0 ? 'VENCE HOY' : 'VENCIDA'}</h2>
        <p style="font-size: 18px;">
          La licencia de conducir de <strong>${data.userName}</strong> 
          ${data.daysExpired === 0 ? 'vence HOY' : `está VENCIDA hace ${data.daysExpired} días`}.
        </p>
      </div>
      
      <p><strong>Conductor:</strong> ${data.userName}</p>
      <p><strong>Email:</strong> ${data.userEmail}</p>
      <p><strong>Vencimiento:</strong> ${new Date(data.licenseExpiration).toLocaleDateString('es-AR')}</p>

      <p><strong>Acción inmediata:</strong></p>
      <ul>
        <li>${data.daysExpired === 0 ? 'Suspender asignación de vehículos HOY' : 'El conductor NO puede conducir vehículos de la empresa'}</li>
        <li>Gestionar renovación de licencia</li>
        <li>Actualizar documentación en el sistema</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>Sistema de Gestión de Flota Paviotti</p>
    </div>
  </div>
</body>
</html>
      `
    };
  }

  /**
   * Template de email para alertas de seguro
   */
  insuranceAlertEmail(data: {
    plate: string;
    brand: string;
    model: string;
    insuranceExpiry: string;
    daysUntilExpiry: number;
    isExpired: boolean;
  }): { subject: string; html: string } {
    const emoji = data.isExpired ? '⚠️' : '🟡';

    return {
      subject: `${emoji} ${data.isExpired ? 'CRÍTICO' : 'AVISO'}: Seguro del vehículo ${data.plate}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: ${data.isExpired ? '#fee' : '#fff3cd'}; border-left: 5px solid ${data.isExpired ? '#dc3545' : '#ffc107'}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Alerta de Seguro Vehicular</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0;">SEGURO ${data.isExpired ? 'VENCIDO' : 'Próximo a Vencer'}</h2>
        <p style="font-size: 18px;">
          El seguro del vehículo <strong>${data.plate}</strong> 
          ${data.isExpired
          ? `está VENCIDO hace ${Math.abs(data.daysUntilExpiry)} días`
          : `vence en ${data.daysUntilExpiry} días`}.
        </p>
      </div>
      
      <p><strong>Vehículo:</strong> ${data.brand} ${data.model} (${data.plate})</p>
      <p><strong>Vencimiento:</strong> ${new Date(data.insuranceExpiry).toLocaleDateString('es-AR')}</p>

      <p><strong>Acción requerida:</strong></p>
      <ul>
        <li>${data.isExpired ? 'NO usar el vehículo hasta renovar seguro' : 'Contactar aseguradora para renovación'}</li>
        <li>Verificar cobertura actual</li>
        <li>Actualizar póliza en el sistema</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>Sistema de Gestión de Flota Paviotti</p>
    </div>
  </div>
</body>
</html>
      `
    };
  }

  /**
   * Template de email para alertas de mantenimiento
   */
  maintenanceAlertEmail(data: {
    plate: string;
    brand: string;
    model: string;
    reason: string;
  }): { subject: string; html: string } {
    return {
      subject: `🔧 Mantenimiento Requerido: ${data.plate}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: #fff3cd; border-left: 5px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 Alerta de Mantenimiento</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0;">MANTENIMIENTO PROGRAMADO</h2>
        <p style="font-size: 18px;">
          El vehículo <strong>${data.plate}</strong> necesita service.
        </p>
      </div>
      
      <p><strong>Vehículo:</strong> ${data.brand} ${data.model} (${data.plate})</p>
      <p><strong>Motivo:</strong> ${data.reason}</p>

      <p><strong>Acción requerida:</strong></p>
      <ul>
        <li>Programar turno en taller</li>
        <li>Verificar disponibilidad mecánico</li>
        <li>Coordinar vehículo de reemplazo si es necesario</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>Sistema de Gestión de Flota Paviotti</p>
    </div>
  </div>
</body>
</html>
      `
    };
  }
}

export const emailService = new EmailService();
