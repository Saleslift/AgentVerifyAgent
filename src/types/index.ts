// Unified Property Interface

export type Property = CamelizeKeys<DB_Properties>

export type UnitType = CamelizeKeys<DB_Unit_Types>

export type AgentUnitType = CamelizeKeys<DB_Agent_Unit_Types>


// Unified Certification Interface
export interface Certification {
  id: string;
  name: string;
  file_url: string;
  is_rera: boolean;
  rera_number?: string;
}

// Unified ServiceArea Interface
export interface ServiceArea {
  id: string;
  location: string;
}

// Unified Agent Interface
export interface Agent {
  id: string;
  name?: string; // From AgentVerifyAgent
  full_name?: string; // From AgentVerifyAgency
  introduction?: string; // From AgentVerifyAgent
  photo?: string; // From AgentVerifyAgent
  avatar_url?: string | null; // From AgentVerifyAgency
  whatsapp?: string | null; // From AgentVerifyAgency
  phone?: string | null; // From AgentVerifyAgency
  email: string;
  agencyLogo?: string; // From AgentVerifyAgent
  agencyName?: string; // From AgentVerifyAgent
  agencyWebsite?: string; // From AgentVerifyAgent
  agencyEmail?: string; // From AgentVerifyAgent
  agencyFormationDate?: string; // From AgentVerifyAgent
  agencyTeamSize?: number; // From AgentVerifyAgent
  verified?: boolean; // From AgentVerifyAgent
  bio?: string; // From AgentVerifyAgent
  languages?: string[]; // From AgentVerifyAgent
  specialties?: string[]; // From AgentVerifyAgent
  registrationNumber?: string; // From AgentVerifyAgent
  location?: string; // From AgentVerifyAgent
  experience?: string; // From AgentVerifyAgent
  activeListings?: number; // From AgentVerifyAgent
  reviews?: Review[]; // From AgentVerifyAgent
  youtube?: string; // From AgentVerifyAgent
  facebook?: string; // From AgentVerifyAgent
  instagram?: string; // From AgentVerifyAgent
  linkedin?: string; // From AgentVerifyAgent
  tiktok?: string; // From AgentVerifyAgent
  x?: string; // From AgentVerifyAgent
  serviceAreas?: ServiceArea[]; // From AgentVerifyAgent
  certifications?: Certification[]; // From AgentVerifyAgent
  slug?: string; // From AgentVerifyAgent
  currentUserId?: string; // From AgentVerifyAgent
  status?: string; // From AgentVerifyAgency
  created_at?: string; // From AgentVerifyAgency
  agency_id?: string; // From AgentVerifyAgency
}

// Unified Review Interface
export interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  agent_reply?: string;
  reviewer: {
    full_name: string;
    avatar_url: string;
  };
}

// Unified AgencyProfile Interface
export interface AgencyProfile {
  id: string;
  name: string;
  email: string;
  logo?: string;
  location?: string;
  phone?: string;
  website?: string;
  formationDate?: string;
  teamSize?: number;
  agentCount?: number;
  propertyCount?: number;
}

// Unified JobPosting Interface
export interface JobPosting {
  id: string;
  title: string;
  experienceRequired: string;
  languages: string[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  qualifications: string[];
  deadline: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  applicationCount?: number;
}

// Unified JobApplication Interface
export interface JobApplication {
  id: string;
  jobId: string;
  agentId: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  coverLetter?: string;
  createdAt: string;
  agent?: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
    phone?: string;
  };
}

// Unified AgentInvitation Interface
export interface AgentInvitation {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}

// Unified DealType
export type DealType = 'own_property' | 'marketplace' | 'collaboration' | 'off_plan_project';

// Unified Project Interface
export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  developer_name: string;
  developer_logo?: string;
  min_price: number;
  max_price: number;
  min_size: number;
  max_size: number;
  handover_date: string;
  payment_plan: string;
  images: string[];
  videos?: string[];
  brochure_url?: string;
  floorplan_url?: string;
  price_list_url?: string;
  unit_types: UnitType[];
  added_to_agent_page: boolean;
  is_prelaunch?: boolean;
  lat?: number;
  lng?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Unified PropertyFilters Interface
export interface PropertyFilters {
  type?: string;
  locations?: string[];
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  furnishingStatus?: string;
  amenities?: string[];
  completionStatus?: string;
}

export type Camelize<T extends string> = T extends `${infer A}_${infer B}` ? `${A}${Camelize<Capitalize<B>>}` : T


export type CamelizeKeys<T extends object> = {
  [key in keyof T as key extends string ? Camelize<key> : key]: T[key]
}

export type CamelToSnake<T extends string, P extends string = ""> = string extends T
    ? string
    : T extends `${infer C0}${infer R}`
        ? CamelToSnake<
            R,
            `${P}${C0 extends Lowercase<C0> ? "" : "_"}${Lowercase<C0>}`
        >
        : P;

export type CamelKeysToSnake<T> = {
  [K in keyof T as CamelToSnake<Extract<K, string>>]: T[K];
};

export const getMissingFields = (unitType: UnitType): string[] => {
  const propertyKeys = Object.keys(new Property()) as (keyof Property)[];
  const unitTypeKeys = Object.keys(unitType) as (keyof UnitType)[];
  return propertyKeys.filter((key) => !unitTypeKeys.includes(key));
};
