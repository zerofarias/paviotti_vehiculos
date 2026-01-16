# 🚗 Paviotti Fleet Management System

Sistema integral de gestión de flotas vehiculares con características avanzadas de mantenimiento, control y reportes.

## ✨ Características Principales

### 📊 Dashboard Administrativo
- Vista general de la flota con métricas en tiempo real
- Alertas de mantenimiento y vencimientos
- Gráficos de rendimiento y consumo
- Gestión de usuarios y roles

### 🚙 Gestión de Vehículos
- **Perfil completo** de cada unidad con foto e información detallada
- **Mapa de daños** visual interactivo con historial de reparaciones
- **Sistema de neumáticos** con tracking de desgaste y rotación
- **Bitácora universal** para cualquier evento o nota
- **Documentación digital** (VTV, seguros, permisos)
- **Inventario** de elementos requeridos por unidad

### ⚙️ Mantenimiento y Service
- Control semanal de seguridad
- Registro de mantenimientos programados
- Alertas automáticas por kilometraje o tiempo
- Historial completo de servicios con costos
- Tracking de vencimientos (VTV, seguros, matafuegos, licencias)

### ⛽ Gestión de Combustible
- Registro de cargas con foto de ticket
- Análisis de consumo y rendimiento
- Reportes de costos por vehículo
- Gráficos de tendencias

### 📈 Reportes y Analytics
- Detalle de gastos por vehículo
- Reportes de kilometraje
- Exportación a Excel
- Gráficos interactivos con Recharts

### 👥 Gestión de Personal
- Roles: Admin y Staff
- Control de licencias de conducir con alertas de vencimiento
- Foto de perfil y carnet
- Activación/desactivación de usuarios

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Vite** como bundler
- **Recharts** para gráficos
- **XLSX** para exportación de datos

### Backend
- **Express.js** con TypeScript
- **Prisma ORM** para base de datos
- **SQLite** (fácilmente migrable a PostgreSQL/MySQL)
- API RESTful

## 🚀 Instalación

### Prerequisitos
- Node.js 18+ 
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/tuusuario/paviotti-fleet.git
cd paviotti-fleet
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Inicializar base de datos**
```bash
npx prisma generate
npx prisma db push
```

5. **Iniciar en modo desarrollo**
```bash
npm run dev
```

El servidor frontend estará en `http://localhost:5173`
El servidor backend estará en `http://localhost:3001`

## 📱 Responsive & Mobile-First

El sistema está completamente optimizado para dispositivos móviles:
- ✅ Diseño mobile-first
- ✅ Navegación táctil optimizada
- ✅ Formularios con inputs grandes (44px+ touch targets)
- ✅ Modales adaptados para pantallas pequeñas
- ✅ Sin scroll horizontal, 100% responsive

## 🗂️ Estructura del Proyecto

```
paviotti-fleet/
├── prisma/              # Esquema y migraciones de Prisma
├── server/              # Backend Express
│   └── index.ts        # API endpoints
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas principales
│   ├── constants.tsx   # Íconos y constantes
│   └── types.ts        # Definiciones TypeScript
├── public/             # Assets estáticos
└── package.json
```

## 🔐 Seguridad

- No se suben archivos `.env` ni credenciales
- Datos sensibles en variables de entorno
- Base de datos local (SQLite) no incluida en repo

## 📄 Licencia

Proyecto privado - Todos los derechos reservados © Paviotti

## 👨‍💻 Desarrollo

Desarrollado con ❤️ para optimizar la gestión de flotas vehiculares.

---

**Nota:** Este README se actualiza continuamente con nuevas características.
