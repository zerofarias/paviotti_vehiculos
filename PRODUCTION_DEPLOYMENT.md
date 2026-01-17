# 🚀 Checklist de Producción - Paviotti Fleet

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. 🔐 **Seguridad y Variables de Entorno**

- [ ] **Generar secrets seguros** (NO usar los de desarrollo)
  ```bash
  # En PowerShell
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
  ```

- [ ] **Actualizar `.env` de producción:**
  ```env
  # JWT Secrets - CAMBIAR OBLIGATORIO
  JWT_SECRET="[secret-generado-con-openssl-32-bytes]"
  JWT_REFRESH_SECRET="[otro-secret-diferente-32-bytes]"
  SSO_SECRET="[secret-para-sso-32-bytes]"
  
  # Base de datos
  DATABASE_URL="mysql://usuario:password@localhost:3306/paviotti_fleet"
  
  # Servidor
  NODE_ENV="production"
  PORT=3001
  
  # Frontend URL (tu dominio real)
  FRONTEND_URL="https://fleet.paviotti.com.ar"
  
  # Email
  EMAIL_ALERTS_ENABLED=true
  NOTIFICATION_EMAIL="gerencia@paviotti.com.ar"
  SMTP_HOST="mail.paviotti.com.ar"
  SMTP_PORT="587"
  SMTP_USER="soporte@paviotti.com.ar"
  SMTP_PASSWORD="[password-real]"
  
  # Notificaciones externas (opcional)
  EXTERNAL_API_URL=""
  EXTERNAL_API_KEY=""
  WEBHOOK_SECRET=""
  ```

- [ ] **Verificar que `.env` NO esté en Git**
  ```bash
  # Verificar .gitignore
  cat .gitignore | grep .env
  ```

---

### 2. 📦 **Base de Datos**

- [ ] **Crear base de datos de producción**
  ```sql
  CREATE DATABASE paviotti_fleet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'fleet_user'@'localhost' IDENTIFIED BY 'password-seguro';
  GRANT ALL PRIVILEGES ON paviotti_fleet.* TO 'fleet_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

- [ ] **Ejecutar migraciones de Prisma**
  ```bash
  npx prisma migrate deploy
  ```

- [ ] **Crear usuario administrador**
  ```bash
  npm run create-admin
  ```

- [ ] **Configurar backups automáticos**
  ```bash
  # Ejemplo de cron para backup diario a las 2 AM
  0 2 * * * mysqldump -u fleet_user -p paviotti_fleet > /backups/paviotti_fleet_$(date +\%Y\%m\%d).sql
  ```

---

### 3. 🏗️ **Build del Proyecto**

- [ ] **Build del frontend**
  ```bash
  npm run build
  ```
  Esto genera los archivos estáticos en `/dist`

- [ ] **Compilar TypeScript del backend** (opcional, si usas compilación)
  ```bash
  npx tsc server/index.ts --outDir dist-server
  ```

---

### 4. 🌐 **Servidor Web**

#### **Opción A: Nginx como Reverse Proxy** (Recomendado)

- [ ] **Instalar Nginx**
  ```bash
  # En Ubuntu/Debian
  sudo apt update
  sudo apt install nginx
  ```

- [ ] **Configurar Nginx** (`/etc/nginx/sites-available/paviotti-fleet`)
  ```nginx
  server {
      listen 80;
      server_name fleet.paviotti.com.ar;

      # Redirigir a HTTPS
      return 301 https://$server_name$request_uri;
  }

  server {
      listen 443 ssl http2;
      server_name fleet.paviotti.com.ar;

      # SSL Certificates
      ssl_certificate /etc/letsencrypt/live/fleet.paviotti.com.ar/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/fleet.paviotti.com.ar/privkey.pem;

      # Frontend (archivos estáticos)
      root /var/www/paviotti-fleet/dist;
      index index.html;

      location / {
          try_files $uri $uri/ /index.html;
      }

      # Backend API
      location /api {
          proxy_pass http://localhost:3001;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      }
  }
  ```

- [ ] **Habilitar sitio**
  ```bash
  sudo ln -s /etc/nginx/sites-available/paviotti-fleet /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl restart nginx
  ```

#### **Opción B: Apache como Reverse Proxy**

- [ ] **Configurar Apache** (`/etc/apache2/sites-available/paviotti-fleet.conf`)
  ```apache
  <VirtualHost *:80>
      ServerName fleet.paviotti.com.ar
      Redirect permanent / https://fleet.paviotti.com.ar/
  </VirtualHost>

  <VirtualHost *:443>
      ServerName fleet.paviotti.com.ar

      SSLEngine on
      SSLCertificateFile /etc/letsencrypt/live/fleet.paviotti.com.ar/fullchain.pem
      SSLCertificateKeyFile /etc/letsencrypt/live/fleet.paviotti.com.ar/privkey.pem

      DocumentRoot /var/www/paviotti-fleet/dist

      <Directory /var/www/paviotti-fleet/dist>
          Options -Indexes +FollowSymLinks
          AllowOverride All
          Require all granted
      </Directory>

      ProxyPreserveHost On
      ProxyPass /api http://localhost:3001/api
      ProxyPassReverse /api http://localhost:3001/api
  </VirtualHost>
  ```

---

### 5. 🔒 **SSL/HTTPS**

- [ ] **Instalar Certbot (Let's Encrypt)**
  ```bash
  sudo apt install certbot python3-certbot-nginx
  ```

- [ ] **Obtener certificado SSL**
  ```bash
  sudo certbot --nginx -d fleet.paviotti.com.ar
  ```

- [ ] **Configurar renovación automática**
  ```bash
  # Verificar que el cron ya esté configurado
  sudo certbot renew --dry-run
  ```

---

### 6. 🔄 **Process Manager (PM2)**

- [ ] **Instalar PM2**
  ```bash
  npm install -g pm2
  ```

- [ ] **Crear archivo de configuración PM2** (`ecosystem.config.js`)
  ```javascript
  module.exports = {
    apps: [{
      name: 'paviotti-fleet-api',
      script: 'server/index.ts',
      interpreter: 'tsx',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }]
  };
  ```

- [ ] **Iniciar con PM2**
  ```bash
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup
  ```

- [ ] **Monitorear**
  ```bash
  pm2 status
  pm2 logs
  pm2 monit
  ```

---

### 7. 🛡️ **Firewall**

- [ ] **Configurar UFW (Ubuntu)**
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```

---

### 8. 📊 **Monitoring y Logs**

- [ ] **Crear directorio de logs**
  ```bash
  mkdir -p /var/www/paviotti-fleet/logs
  ```

- [ ] **Configurar logrotate** (`/etc/logrotate.d/paviotti-fleet`)
  ```
  /var/www/paviotti-fleet/logs/*.log {
      daily
      missingok
      rotate 14
      compress
      delaycompress
      notifempty
      create 0640 www-data www-data
      sharedscripts
  }
  ```

- [ ] **Opcional: Instalar herramientas de monitoreo**
  - PM2 Plus (https://pm2.io)
  - New Relic
  - Datadog
  - Sentry (para errores)

---

### 9. 🔧 **Optimizaciones**

- [ ] **Actualizar CORS en producción**
  ```typescript
  // server/index.ts
  app.use(cors({
    origin: ['https://fleet.paviotti.com.ar'],
    credentials: true
  }));
  ```

- [ ] **Configurar cache headers en Nginx**
  ```nginx
  location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
  }
  ```

- [ ] **Comprimir respuestas**
  ```nginx
  gzip on;
  gzip_vary on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
  ```

---

### 10. 📝 **Documentación**

- [ ] **Documentar credenciales** (en un lugar seguro)
  - URL del servidor
  - Usuario SSH
  - Credenciales de base de datos
  - Credenciales de email
  - Usuario admin inicial

- [ ] **Crear manual de operación**
  - Cómo reiniciar el servidor
  - Cómo ver logs
  - Cómo hacer backup
  - Contactos de soporte

---

## 🧪 TESTING EN PRODUCCIÓN

- [ ] **Verificar login**
- [ ] **Verificar creación de vehículos**
- [ ] **Verificar envío de emails**
- [ ] **Verificar cron jobs** (esperar hasta 8 AM o 10 AM)
- [ ] **Verificar Swagger UI** (https://fleet.paviotti.com.ar/api-docs)
- [ ] **Verificar SSL** (candado verde en navegador)
- [ ] **Verificar responsive en móvil**

---

## 🚨 POST-DEPLOYMENT

- [ ] **Monitorear logs por 24 horas**
  ```bash
  pm2 logs --lines 100
  tail -f /var/log/nginx/access.log
  ```

- [ ] **Verificar uso de recursos**
  ```bash
  pm2 monit
  htop
  ```

- [ ] **Configurar alertas** (opcional)
  - PM2 notifications
  - Uptime monitoring (UptimeRobot, Pingdom)

---

## 📦 DEPLOYMENT SCRIPT

**Script de deployment** (`deploy.sh`):
```bash
#!/bin/bash

echo "🚀 Deploying Paviotti Fleet..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production

# Build frontend
npm run build

# Run migrations
npx prisma migrate deploy

# Restart PM2
pm2 restart ecosystem.config.js

echo "✅ Deployment complete!"
```

---

## 🔄 ACTUALIZACIÓN (Updates)

Para actualizar el sistema en producción:
```bash
# 1. Conectar al servidor
ssh usuario@servidor.com

# 2. Ir al directorio
cd /var/www/paviotti-fleet

# 3. Ejecutar script de deployment
./deploy.sh

# 4. Verificar
pm2 status
pm2 logs
```

---

## 📞 SOPORTE

**Contactos importantes:**
- Proveedor de hosting: ___________
- Soporte de email: ___________
- Desarrollador: ___________

---

## ✅ RESUMEN RÁPIDO

```bash
# 1. Clonar en servidor
git clone [repo] /var/www/paviotti-fleet
cd /var/www/paviotti-fleet

# 2. Configurar .env
cp .env.example .env
nano .env  # Editar con valores de producción

# 3. Instalar dependencias
npm ci --production

# 4. Build
npm run build

# 5. Setup base de datos
npx prisma migrate deploy
npm run create-admin

# 6. Configurar Nginx
sudo nano /etc/nginx/sites-available/paviotti-fleet
sudo ln -s /etc/nginx/sites-available/paviotti-fleet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 7. SSL
sudo certbot --nginx -d fleet.paviotti.com.ar

# 8. Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 9. Verificar
pm2 status
pm2 logs
```

---

**¿Listo para producción?** 🎉
