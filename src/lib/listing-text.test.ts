import { describe, expect, it } from 'vitest';
import {
  describeAvailability,
  describeLegalStatus,
  describeSoftPrefs,
  describeWantedAssetTypes,
  describeWantedSummary,
  describeWantedValueRange,
  describeWantedWindow,
  listingFeatures,
  listingKind,
  listingTitle,
  wantsResidential,
} from './listing-text';
import type { Listing } from './types';

/** מודעה מינימלית לבדיקות — רק מה שהפונקציה הנבדקת קוראת. */
function listing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'l1',
    owner_id: 'u1',
    status: 'active',
    city: 'תל אביב',
    neighborhood: 'לב העיר',
    street: 'מזא״ה',
    rooms: 3,
    size_sqm: 75,
    floor: 2,
    total_floors: 4,
    has_elevator: false,
    has_parking: false,
    has_balcony: false,
    has_safe_room: false,
    building_year: 1978,
    condition: 'maintained',
    urban_renewal_status: 'none',
    asking_value: 4_500_000,
    description: null,
    wanted_cities: ['הרצליה'],
    wanted_min_rooms: null,
    wanted_max_rooms: null,
    wanted_min_sqm: null,
    must_haves: [],
    cash_add_max: 0,
    cash_receive_min: 0,
    asset_type: 'apartment',
    neighborhood_id: null,
    house_number: null,
    gush: null,
    helka: null,
    tat_helka: null,
    right_type: 'ownership',
    lease_contract_no: null,
    has_mortgage: false,
    mortgage_balance: null,
    has_caveats: false,
    has_liens: false,
    has_tenant: false,
    tenant_lease_ends: null,
    available_from: null,
    available_until: null,
    availability_flex_months: 0,
    parking_count: 0,
    has_storage: false,
    commercial_use: null,
    annual_yield: null,
    land_zoning: null,
    building_rights_sqm: null,
    land_is_fenced: null,
    land_is_vacant: null,
    ownership_status: 'approved',
    ownership_declared_all_owners: false,
    avm_value: null,
    avm_updated_at: null,
    wanted_asset_types: ['apartment'],
    wanted_neighborhood_ids: [],
    wanted_min_floor: null,
    wanted_value_min: null,
    wanted_value_max: null,
    wanted_available_from: null,
    wanted_available_until: null,
    soft_prefs: {},
    broker_id: null,
    locked_until: null,
    exclusivity_match_id: null,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('listingKind ו-listingTitle', () => {
  it('נכס מגורים מתואר לפי חדרים', () => {
    expect(listingKind(listing({ rooms: 3.5 }))).toBe('3.5 חדרים');
    expect(listingTitle(listing({ rooms: 4, city: 'רמת גן' }))).toBe('4 חדרים ברמת גן');
  });

  it('נכס שאינו מגורים מתואר לפי הסוג, בלי חדרים', () => {
    const shop = listing({ asset_type: 'shop', rooms: null, city: 'רמת גן' });
    expect(listingKind(shop)).toBe('חנות');
    expect(listingTitle(shop)).toBe('חנות ברמת גן');
    expect(listingTitle(listing({ asset_type: 'land', rooms: null }))).toBe('קרקע בתל אביב');
  });
});

describe('listingFeatures', () => {
  it('מציג מספר חניות כשיש יותר מאחת', () => {
    expect(listingFeatures(listing({ has_parking: true, parking_count: 2 }))).toContain('2 חניות');
    expect(listingFeatures(listing({ has_parking: true, parking_count: 1 }))).toContain('חניה');
  });

  it('מוסיף מחסן ומדלג על מה שאין', () => {
    expect(listingFeatures(listing({ has_storage: true, has_elevator: true }))).toEqual([
      'מעלית',
      'מחסן',
    ]);
    expect(listingFeatures(listing())).toEqual([]);
  });
});

describe('describeAvailability', () => {
  it('מנסח חלון מלא עם גמישות', () => {
    expect(
      describeAvailability(
        listing({
          available_from: '2027-05-01',
          available_until: '2027-11-01',
          availability_flex_months: 3,
        }),
      ),
    ).toBe('1 במאי 2027 עד 1 בנובמבר 2027 · גמישות של עד 3 חודשים');
  });

  it('מנסח חודש וחודשיים בעברית תקינה', () => {
    const base = { available_from: '2027-05-01', available_until: '2027-11-01' };
    expect(describeAvailability(listing({ ...base, availability_flex_months: 1 }))).toContain(
      'עד חודש',
    );
    expect(describeAvailability(listing({ ...base, availability_flex_months: 2 }))).toContain(
      'עד חודשיים',
    );
  });

  it('מתמודד עם חלון חד־צדדי ועם חלון ריק', () => {
    expect(describeAvailability(listing({ available_from: '2027-05-01' }))).toBe('מ-1 במאי 2027');
    expect(describeAvailability(listing({ available_until: '2027-05-01' }))).toBe('עד 1 במאי 2027');
    expect(describeAvailability(listing())).toBe('לא הוגדר');
  });
});

describe('describeWantedWindow', () => {
  it('חלון ריק נקרא "גמיש"', () => {
    expect(describeWantedWindow(listing())).toBe('גמיש');
  });

  it('מנסח טווח מלא', () => {
    expect(
      describeWantedWindow(
        listing({ wanted_available_from: '2027-03-01', wanted_available_until: '2028-03-31' }),
      ),
    ).toBe('1 במרץ 2027 עד 31 במרץ 2028');
  });
});

describe('describeLegalStatus', () => {
  it('נכס נקי מחזיר רשימה ריקה', () => {
    expect(describeLegalStatus(listing())).toEqual([]);
  });

  it('מונה את כל ההצהרות, כולל תום חוזה שכירות', () => {
    expect(
      describeLegalStatus(
        listing({
          has_mortgage: true,
          has_caveats: true,
          has_liens: true,
          has_tenant: true,
          tenant_lease_ends: '2027-09-30',
        }),
      ),
    ).toEqual([
      'משכנתא רשומה',
      'הערות אזהרה',
      'עיקולים',
      'שוכר בנכס, חוזה עד 30 בספטמבר 2027',
    ]);
  });

  it('שוכר בלי תאריך חוזה', () => {
    expect(describeLegalStatus(listing({ has_tenant: true }))).toEqual(['שוכר בנכס']);
  });
});

describe('describeSoftPrefs', () => {
  it('מדלג על העדפות במשקל 0 וממיין מהחשוב ביותר', () => {
    expect(
      describeSoftPrefs(
        listing({ soft_prefs: { elevator: 1, parking: 3, balcony: 0, safe_room: 2 } }),
      ),
    ).toEqual(['חניה ★★★', 'ממ״ד ★★', 'מעלית ★']);
  });

  it('בלי העדפות — רשימה ריקה', () => {
    expect(describeSoftPrefs(listing())).toEqual([]);
  });
});

describe('describeWantedValueRange', () => {
  it('מנסח טווח, גבול אחד, ולא־הוגדר', () => {
    expect(
      describeWantedValueRange(listing({ wanted_value_min: 3_000_000, wanted_value_max: 4_000_000 })),
    ).toBe('3 מיליון ₪ עד 4 מיליון ₪');
    expect(describeWantedValueRange(listing({ wanted_value_min: 3_000_000 }))).toBe(
      'לפחות 3 מיליון ₪',
    );
    expect(describeWantedValueRange(listing({ wanted_value_max: 4_000_000 }))).toBe(
      'עד 4 מיליון ₪',
    );
    expect(describeWantedValueRange(listing())).toBeNull();
  });
});

describe('סוגי הנכס המבוקשים', () => {
  it('מזהה בקשה שכוללת מגורים', () => {
    expect(wantsResidential(listing({ wanted_asset_types: ['shop', 'office'] }))).toBe(false);
    expect(wantsResidential(listing({ wanted_asset_types: ['shop', 'house'] }))).toBe(true);
  });

  it('רשימה ריקה נקראת כדירה, כמו במנוע', () => {
    expect(wantsResidential(listing({ wanted_asset_types: [] }))).toBe(true);
    expect(describeWantedAssetTypes(listing({ wanted_asset_types: [] }))).toBe('דירה');
  });

  it('מנסח כמה סוגים', () => {
    expect(describeWantedAssetTypes(listing({ wanted_asset_types: ['apartment', 'land'] }))).toBe(
      'דירה / קרקע',
    );
  });
});

describe('describeWantedSummary', () => {
  it('לא מזכיר חדרים כשמחפשים נכס שאינו מגורים', () => {
    const summary = describeWantedSummary(
      listing({ wanted_asset_types: ['shop'], wanted_min_rooms: 3 }),
    );
    expect(summary).toContain('חנות');
    expect(summary).not.toContain('חדרים');
  });

  it('מזכיר חדרים כשמחפשים דירה', () => {
    expect(
      describeWantedSummary(listing({ wanted_min_rooms: 3, wanted_max_rooms: 4 })),
    ).toContain('3 עד 4 חדרים');
  });
});
