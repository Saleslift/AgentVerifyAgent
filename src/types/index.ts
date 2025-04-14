export interface ServiceArea {
  id: string;
  location: string;
}

export interface Certification {
  id: string;
  name: string;
  file_url: string;
  is_rera: boolean;
  rera_number?: string;
}

interface Review {
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

export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'Apartment' | 'Penthouse' | 'Townhouse' | 'House' | 'Villa' | 'Land';
  contractType: 'Sale' | 'Rent';
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  highlight: string;
  images: string[];
  videos?: string[];
  agentId: string;
  shared: boolean;
  amenities?: string[];
  customAmenities?: string[];
  furnishingStatus?: 'Furnished' | 'Unfurnished' | 'Semi-Furnished';
  completionStatus?: 'Ready' | 'Off-plan resale' | 'Off-Plan';
  lat?: number;
  lng?: number;
  source?: 'direct' | 'marketplace';
  creator_type?: 'agent' | 'agency' | 'developer';
  creator_id?: string;
  floorPlanImage?: string;
  parkingAvailable?: boolean;
  slug?: string;
  handoverDate?: string;
  created_at?: string;
}

export interface Agent {
  id: string;
  name: string;
  introduction: string;
  photo: string;
  agencyLogo: string;
  agencyName: string;
  agencyWebsite?: string;
  agencyEmail?: string;
  agencyFormationDate?: string;
  agencyTeamSize?: number;
  verified: boolean;
  bio: string;
  languages: string[];
  specialties: string[];
  registrationNumber: string;
  whatsapp: string;
  location: string;
  experience: string;
  activeListings: number;
  reviews: Review[];
  youtube?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  x?: string;
  serviceAreas: ServiceArea[];
  certifications: Certification[];
  slug: string;
  currentUserId?: string;
}

export interface UnitType {
  id?: string;
  name: string;
  size_range?: string;
  floor_range?: string;
  price_range?: string;
  status?: 'available' | 'sold out' | 'coming soon';
  units_available?: number;
}

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