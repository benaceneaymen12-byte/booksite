export type ProductType = 'raw_material' | 'finished_product' | 'in_process' | 'other';
export type WaterType = 'purified_water' | 'wfi' | 'other';
export type MediaStatus = 'valid' | 'expiring_soon' | 'expired';

export interface AnalysisResult {
  id?: number;
  colonyCount?: number;
  dilution?: number;
  volumePlated?: number;
  unit?: string;
  result?: string;
  observations?: string;
}

export interface Analysis {
  id?: number;
  sampleId: string;
  productName: string;
  productType: ProductType;
  batchLot?: string;
  samplingDate?: string;
  analysisDate?: string;
  analyst?: string;
  testType?: string;
  sopRef?: string;
  dilution?: number;
  volumePlated?: number;
  colonyCount?: number;
  results: AnalysisResult[];
  unit?: string;
  result?: string;
  observations?: string;
  status: 'draft' | 'completed' | 'pending';
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface PersonnelMonitoring {
  id?: number;
  employeeId: string;
  department?: string;
  site?: string;
  samplingType?: string;
  samplingDate?: string;
  samplingTime?: string;
  analyst?: string;
  medium?: string;
  colonyCount?: number;
  microorganism?: string;
  method?: string;
  sopRef?: string;
  unit?: string;
  result?: string;
  observations?: string;
  status: 'draft' | 'completed' | 'pending';
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface WaterSample {
  id?: number;
  sampleId: string;
  waterType: WaterType;
  samplingPoint?: string;
  samplingDate?: string;
  samplingTime?: string;
  analyst?: string;
  volume?: number;
  dilution?: number;
  colonyCount?: number;
  unit?: string;
  result?: string;
  sopRef?: string;
  observations?: string;
  status: 'draft' | 'completed' | 'pending';
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface CultureMedia {
  id?: number;
  mediumName: string;
  manufacturer?: string;
  lotNumber?: string;
  preparationDate?: string;
  sterilizationDate?: string;
  sterilizationMethod?: string;
  quantityPrepared?: number;
  quantityUsed?: number;
  quantityRemaining?: number;
  expiryDate?: string;
  storageConditions?: string;
  preparedBy?: string;
  volume?: string;
  observations?: string;
  status?: MediaStatus;
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
  unit?: string;
}

export interface PrePouredPetri {
  id?: number;
  mediaId: number;
  mediumName: string;
  lotNumber?: string;
  preparationDate?: string;
  expiryDate?: string;
  quantityPrepared?: number;
  quantityUsed?: number;
  quantityRemaining?: number;
  preparedBy?: string;
  observations?: string;
  createdAt?: string;
}

export interface MediaInventoryItem {
  id?: number;
  mediumName: string;
  lotNumber?: string;
  supplier?: string;
  receivedDate?: string;
  openingDate?: string;
  expiryDate?: string;
  storageLocation?: string;
  quantity?: number;
  unit?: string;
  observations?: string;
}

export interface Microorganism {
  id?: number;
  name: string;
  alternativeName?: string;
  sopRef?: string;
  notes?: string;
  isDemo?: boolean;
}

export interface ShiftReport {
  id?: number;
  date?: string;
  analyst?: string;
  shiftStart?: string;
  shiftEnd?: string;
  shiftLabel?: string;
  activities: string[];
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id?: number;
  user?: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  recordType: string;
  recordId?: number;
  oldValue?: string;
  newValue?: string;
  createdAt?: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Specification {
  id?: number;
  name: string;
  limit?: string;
  unit?: string;
}

export interface SopReference {
  id?: number;
  name: string;
  refCode?: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
}
