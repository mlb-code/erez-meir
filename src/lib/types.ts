export type ListingStatus =
  | 'draft'
  | 'active'
  | 'in_negotiation'
  | 'swapped'
  | 'archived';

export type PropertyCondition =
  | 'new'
  | 'renovated'
  | 'maintained'
  | 'needs_renovation'
  | 'pre_urban_renewal';

export type UrbanRenewalStatus =
  | 'none'
  | 'tama38_planned'
  | 'tama38_approved'
  | 'pinui_binui_planned'
  | 'pinui_binui_approved';

export type PropertyFeature =
  | 'elevator'
  | 'parking'
  | 'balcony'
  | 'safe_room'
  | 'renovated';

export type MatchType = 'direct' | 'chain';

export type MatchStatus =
  | 'suggested'
  | 'interested_partial'
  | 'all_interested'
  | 'dismissed';

export type ResponseType = 'interested' | 'not_interested';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  owner_id: string;
  status: ListingStatus;

  // מה יש לי
  city: string;
  neighborhood: string | null;
  street: string | null;
  rooms: number;
  size_sqm: number;
  floor: number | null;
  total_floors: number | null;
  has_elevator: boolean;
  has_parking: boolean;
  has_balcony: boolean;
  has_safe_room: boolean;
  building_year: number | null;
  condition: PropertyCondition;
  urban_renewal_status: UrbanRenewalStatus;
  /** null אפשרי רק בטיוטה — מודעה פעילה תמיד עם שווי (נאכף גם ברמת ה-DB). */
  asking_value: number | null;
  description: string | null;

  // מה אני מחפש
  wanted_cities: string[];
  wanted_min_rooms: number | null;
  wanted_max_rooms: number | null;
  wanted_min_sqm: number | null;
  must_haves: PropertyFeature[];

  // גמישות מזומן
  cash_add_max: number;
  cash_receive_min: number;

  created_at: string;
  updated_at: string;
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  storage_path: string;
  sort_order: number;
}

export interface Match {
  id: string;
  match_type: MatchType;
  chain_listing_ids: string[];
  score: number;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
}

export interface MatchResponse {
  id: string;
  match_id: string;
  listing_id: string;
  response: ResponseType;
  responded_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

/** מודעה עם התמונות שלה — הצורה שבה רוב המסכים צורכים מודעה. */
export type ListingWithPhotos = Listing & { listing_photos: ListingPhoto[] };
