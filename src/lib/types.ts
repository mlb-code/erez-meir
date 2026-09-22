export type ListingStatus =
  | 'draft'
  | 'pending_ownership'
  | 'ownership_rejected'
  | 'active'
  | 'in_negotiation'
  | 'closing'
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
  | 'renovated'
  | 'no_tenant'
  | 'no_caveats';

export type MatchType = 'direct' | 'chain';

export type MatchStatus =
  | 'suggested'
  | 'interested_partial'
  | 'all_interested'
  | 'meeting_confirmed'
  | 'in_negotiation'
  | 'closing'
  | 'swapped'
  | 'dismissed'
  | 'expired';

// ===== טיפוסים שנוספו באיפיון v1.0 (מיגרציות 002–003) =====

export type AssetType =
  | 'apartment' | 'penthouse' | 'garden_apartment' | 'house'
  | 'office' | 'shop' | 'warehouse' | 'industrial'
  | 'land' | 'parking' | 'storage';

export type RightType = 'ownership' | 'lease_rmi' | 'housing_company';
export type IdentityStatus = 'pending' | 'submitted' | 'verified' | 'rejected';
export type OwnershipStatus = 'pending' | 'approved' | 'rejected' | 'needs_more';
export type AccountType = 'owner' | 'broker' | 'ops';
export type DocumentKind = 'terms' | 'privacy' | 'brokerage_order' | 'meeting_confirmation' | 'closing_report';
export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'cancelled';
export type ReviewDecision = 'approved' | 'rejected' | 'needs_more';
export type ScanAlertStatus = 'new' | 'reviewing' | 'confirmed_bypass' | 'false_positive' | 'reported_closing';
export type ExposureLevel = 'neighborhood' | 'full';

/** העדפות רכות של "מה אני מחפש" — 0 (לא חשוב) עד 3 (חשוב מאוד). */
export type SoftPrefs = Partial<Record<
  'elevator' | 'parking' | 'balcony' | 'safe_room' | 'new_building' | 'renovated' | 'urban_renewal',
  0 | 1 | 2 | 3
>>;

export type ResponseType = 'interested' | 'not_interested';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  // איפיון v1.0
  account_type: AccountType;
  id_number_last4: string | null;
  birth_date: string | null;
  phone_verified_at: string | null;
  identity_status: IdentityStatus;
  identity_reviewed_at: string | null;
  identity_reject_reason: string | null;
  broker_license_no: string | null;
  is_verified_badge: boolean;
  terms_signed_at: string | null;
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

  // איפיון v1.0 — זיהוי, משפטי, זמן, מבוקש מורחב
  asset_type: AssetType;
  neighborhood_id: string | null;
  /** פרטי. null כשלא נחשף (ראו listings_view). */
  house_number: string | null;
  gush: number | null;
  helka: number | null;
  tat_helka: number | null;
  right_type: RightType;
  lease_contract_no: string | null;
  has_mortgage: boolean;
  mortgage_balance: number | null;
  has_caveats: boolean;
  has_liens: boolean;
  has_tenant: boolean;
  tenant_lease_ends: string | null;
  available_from: string | null;
  available_until: string | null;
  availability_flex_months: number;
  parking_count: number;
  has_storage: boolean;
  commercial_use: string | null;
  annual_yield: number | null;
  land_zoning: string | null;
  building_rights_sqm: number | null;
  ownership_status: OwnershipStatus | null;
  ownership_declared_all_owners: boolean;
  avm_value: number | null;
  avm_updated_at: string | null;
  wanted_asset_types: AssetType[];
  wanted_neighborhood_ids: string[];
  wanted_min_floor: number | null;
  wanted_value_min: number | null;
  wanted_value_max: number | null;
  wanted_available_from: string | null;
  wanted_available_until: string | null;
  soft_prefs: SoftPrefs;
  broker_id: string | null;
  locked_until: string | null;
  exclusivity_match_id: string | null;

  created_at: string;
  updated_at: string;
}

/** שורה מתוך listings_view — כמו Listing, עם דגל חשיפה. */
export type ListingView = Listing & { is_revealed: boolean };

export interface ListingPhoto {
  id: string;
  listing_id: string;
  storage_path: string;
  sort_order: number;
  /** תמונה חיצונית שמזהה בניין — מוסתרת עד אישור הפגשה. */
  is_exterior: boolean;
}

export interface Match {
  id: string;
  match_type: MatchType;
  chain_listing_ids: string[];
  score: number;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  /** ציון לכל צד: { listing_id: 0–100 } */
  scores: Record<string, number>;
  estimated_close_probability: number | null;
  negotiation_started_at: string | null;
  negotiation_expires_at: string | null;
}

export interface Neighborhood { id: string; city: string; name: string; sort_order: number; }

export interface SignedDocument {
  id: string; user_id: string; kind: DocumentKind; template_id: string | null; template_version: number | null;
  content_hash: string; signed_at: string; ip: string | null; user_agent: string | null; otp_verified: boolean;
  related_match_id: string | null; related_listing_id: string | null;
}

export interface Closing {
  id: string; match_id: string; listing_id: string; reported_by: string; signed_on: string;
  agreement_path: string | null; reported_at: string; reported_within_14_days: boolean;
  fee_rate: number; fee_base_value: number; fee_amount: number; vat_rate: number; vat_amount: number;
  approved_by: string | null; approved_at: string | null;
  invoice_number: string | null; invoice_path: string | null; invoice_sent_at: string | null;
}

export interface ScanAlert {
  id: string; listing_id: string; public_transaction_id: number | null; match_id: string | null;
  matched_by: string; counterpart_also_sold: boolean; status: ScanAlertStatus;
  handled_by: string | null; handled_at: string | null; notes: string | null; created_at: string;
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
