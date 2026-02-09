// Domain Types

export enum ClaimStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  ANALYZING = "ANALYZING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REQUIRES_REVIEW = "REQUIRES_REVIEW",
}

export enum LocationType {
  CITY = "city",
  HIGHWAY = "highway",
  RURAL = "rural",
}

export enum AccidentType {
  COLLISION = "collision",
  THEFT = "theft",
  FIRE = "fire",
  NATURAL_DISASTER = "natural_disaster",
  FLOOD_SPILL = "flood_spill",
  SLIP = "slip",
  VEHICLE_FIRE = "vehicle_fire",
  WEATHER_CONDITIONS = "weather_conditions",
}

export enum VehicleType {
  TWO_WHEELER = "Two Wheeler",
  FOUR_WHEELER = "Four Wheeler",
  TRUCK = "Truck",
  BUS = "Bus",
  OTHER = "Other",
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "company";
  company?: string;
}

export interface Claim {
  id: string;
  userId: string;
  userName?: string; // Denormalized for display
  status: ClaimStatus;
  createdAt: string;
  policyNumber: string;
  policyExpiryDate: string;
  daysToExpiry: number;
  claimablePolicy: boolean;
  incidentDetails: {
    accidentDate: string;
    accidentTime: string; // HH:mm
    locationType: LocationType;
    description?: string;
    coordinates?: { lat: number; lng: number };
  };
  vehicleDetails: {
    registrationNumber: string;
    insurerName: string; // Company Name
    vehicleType: VehicleType;
    carAge: number;
    vin?: string;
  };
  accidentSpecifics: {
    accidentType: AccidentType;
    damageParts: string[];
    previousClaims: number;
    policeReport: boolean;
    driverAtFault: boolean;
    driverAge: number;
    driverLicenseValid: boolean;
    alcoholIntoxicated: boolean;
    witnessName?: string;
  };
  images: Array<{
    id: string;
    url: string;
    thumbnail?: string;
    type: string;
    annotations?: any[];
  }>;
  aiAnalysis?: {
    damagePercent: number;
    confidence: number;
    approvalProbability: number;
    explanations: string[];
    ragMatches: Array<{
      text: string;
      source: string;
      page: number;
      score: number;
    }>;
    // New Fields
    severity?: string;
    evidence_strength?: string;
    claimability?: string;
    annotated_images?: string[];
    worst_damage?: string;
    damage_detected?: boolean;
    // Parsed Content
    explanation?: string;
    visual_analysis?: string;
    evidence_list?: string[];
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

// Stats for dashboard
export interface DashboardStats {
  total: number;
  pending: number;
  avgDamage: number;
  recentClaims: Claim[];
}
