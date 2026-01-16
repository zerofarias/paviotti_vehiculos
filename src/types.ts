
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  photo?: string;
  licensePhoto?: string;
  licenseExpiration?: string;
  phone?: string;
  active: boolean;
}

export interface MaintenanceConfig {
  serviceKmInterval: number;
  serviceMonthInterval: number;
  tireChangeKmInterval: number;
  checkIntervalDays: number;
  notificationEmail: string;
  enableEmailAlerts: boolean;
  smtpServer?: string;
  smtpUser?: string;
  alertOnService: boolean;
  alertOnLicense: boolean;
  alertOnFireExtinguisher: boolean;
}

export interface DamagePoint {
  id: string;
  x: number;
  y: number;
  description: string;
  photo?: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_repair' | 'repaired';
  repairCost?: number;
  repairDate?: string;
  repairNotes?: string;
}

export interface FuelLog {
  id: string;
  date: string;
  mileage: number;
  liters: number;
  cost: number;
  ticketPhoto?: string;
  consumption?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  present: boolean;
  condition: string;
}

export interface DamageHistory {
  id: string;
  vehicleId: string;
  x: number;
  y: number;
  type: string;
  description?: string;
  severity?: string;
  reportedDate: string;
  repairedDate: string;
  repairedBy?: string;
  repairCost?: number;
  repairNotes?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  chassisNumber?: string;
  motorNumber?: string;
  color: string;
  photos: string[];
  mainPhotoIndex: number;

  // Documentation
  vtvExpiry?: string;
  insuranceExpiry?: string;
  insurancePolicy?: string;
  vtvPhoto?: string;
  greenCardPhoto?: string;

  currentMileage: number;
  lastServiceMileage: number;
  lastServiceDate: string;
  lastCheckDate?: string;
  lastCheckUser?: string;
  status: 'active' | 'maintenance' | 'out_of_service';
  damagePoints: DamagePoint[];
  damageHistory?: DamageHistory[];
  fuelLogs: FuelLog[];
  inventory: InventoryItem[];
  tires?: Tire[];
}

export enum CheckType {
  WEEKLY_SAFETY = 'WEEKLY_SAFETY',
  FORTNIGHTLY_ENGINE = 'FORTNIGHTLY_ENGINE',
  SERVICE = 'SERVICE',
  INCIDENT = 'INCIDENT',
  FUEL = 'FUEL',
  INVENTORY_EXIT = 'INVENTORY_EXIT',
  INVENTORY_RETURN = 'INVENTORY_RETURN'
}

export type FluidLevel = 'normal' | 'low';

export interface CheckLog {
  id: string;
  vehicleId: string;
  userId: string;
  userName: string;
  type: CheckType;
  timestamp: string;
  mileage: number;
  details: {
    tirePressurePsi?: number;
    oilLevel?: FluidLevel;
    coolantLevel?: FluidLevel;
    brakeFluidLevel?: FluidLevel;
    wiperFluidLevel?: FluidLevel;
    lightsOk?: boolean;
    hornOk?: boolean;
    fireExtinguisherOk?: boolean;
    fireExtinguisherExpiry?: string;
    spareTireOk?: boolean;
    notes?: string;
    itemsChecked?: string[];
    cleanlinessOk?: boolean;
    uniformOk?: boolean;
    fuelLiters?: number;
    fuelCost?: number;
    workshopName?: string;
    serviceCost?: number;
    ticketPhoto?: string;
  };
}

export interface FleetStats {
  totalVehicles: number;
  needingService: number;
  totalCheckupsToday: number;
}

export interface VehicleNote {
  id: string;
  vehicleId: string;
  title: string;
  description?: string;
  date: string;
  type: 'GENERAL' | 'CLEANING' | 'ACCESSORY' | 'FINE' | 'OTHER';
  cost: number;
  attachment?: string;
  createdBy?: string;
}

export interface Tire {
  id: string;
  vehicleId: string;
  position: 'FL' | 'FR' | 'RL' | 'RR' | 'SPARE';
  brand: string;
  model: string;
  size: string;
  installDate: string;
  installMileage: number;
  estimatedLife: number;
  status: 'GOOD' | 'WARNING' | 'CRITICAL';
  currentTread?: number;
}
