import { describe, expect, it } from 'vitest';
import { parseDetailsForm, parseSoftPrefs, parseWantedForm, valueSchema } from './listing-form';

/** בונה FormData כמו שהדפדפן שולח: רק שדות שהפקד שלהם מוצג בפועל. */
function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const APARTMENT = {
  asset_type: 'apartment',
  city: 'תל אביב',
  right_type: 'ownership',
  availability_flex_months: '0',
  size_sqm: '75',
  rooms: '3',
  parking_count: '0',
  condition: 'maintained',
  urban_renewal_status: 'none',
};

const LAND = {
  asset_type: 'land',
  city: 'רעננה',
  right_type: 'ownership',
  availability_flex_months: '0',
  size_sqm: '2500',
};

const SHOP = {
  asset_type: 'shop',
  city: 'רמת גן',
  right_type: 'ownership',
  availability_flex_months: '0',
  size_sqm: '90',
  parking_count: '2',
  condition: 'renovated',
};

/** אותו טופס בלי שדה אחד — כדי לבדוק מה קורה כשפקד לא נשלח כלל. */
function without(fields: Record<string, string>, key: string): Record<string, string> {
  const copy = { ...fields };
  delete copy[key];
  return copy;
}

/** מחלץ את values, ונכשל עם הודעת השגיאה כשהפרסור נכשל. */
function values(result: ReturnType<typeof parseDetailsForm>): Record<string, unknown> {
  if ('error' in result) throw new Error(`ציפינו להצלחה, התקבלה שגיאה: ${result.error}`);
  return result.values;
}

function error(result: { error?: string } | { values: unknown }): string {
  if (!('error' in result)) throw new Error('ציפינו לשגיאה, הפרסור הצליח');
  return result.error as string;
}

describe('parseDetailsForm — דירה', () => {
  it('שומר את שדות המגורים ומחשב has_parking ממספר החניות', () => {
    const result = values(
      parseDetailsForm(
        form({
          ...APARTMENT,
          parking_count: '2',
          floor: '3',
          total_floors: '6',
          building_year: '1998',
          has_elevator: 'on',
          has_storage: 'on',
        }),
      ),
    );

    expect(result.rooms).toBe(3);
    expect(result.parking_count).toBe(2);
    expect(result.has_parking).toBe(true);
    expect(result.has_elevator).toBe(true);
    expect(result.has_storage).toBe(true);
    expect(result.has_balcony).toBe(false);
    expect(result.floor).toBe(3);
    expect(result.building_year).toBe(1998);
  });

  it('אפס חניות מכבה את has_parking', () => {
    expect(values(parseDetailsForm(form(APARTMENT))).has_parking).toBe(false);
  });

  it('דורש מספר חדרים', () => {
    expect(error(parseDetailsForm(form(without(APARTMENT, 'rooms'))))).toContain('חדרים');
  });

  it('פוסל קומה גבוהה ממספר הקומות בבניין', () => {
    expect(
      error(parseDetailsForm(form({ ...APARTMENT, floor: '9', total_floors: '4' }))),
    ).toContain('הקומה גבוהה');
  });

  it('פוסל שטח לא סביר לדירה', () => {
    expect(error(parseDetailsForm(form({ ...APARTMENT, size_sqm: '9' })))).toContain('15');
  });
});

describe('parseDetailsForm — סוג נכס קובע אילו שדות נשמרים', () => {
  it('קרקע נשמרת בלי חדרים, בלי קומה ועם זכויות בנייה', () => {
    const result = values(
      parseDetailsForm(
        form({
          ...LAND,
          land_zoning: 'מגורים',
          building_rights_sqm: '1200',
          land_is_fenced: 'on',
        }),
      ),
    );

    expect(result.rooms).toBeNull();
    expect(result.floor).toBeNull();
    expect(result.land_zoning).toBe('מגורים');
    expect(result.building_rights_sqm).toBe(1200);
    expect(result.land_is_fenced).toBe(true);
    expect(result.land_is_vacant).toBe(false);
  });

  it('נכס מסחרי נשמר עם ייעוד ותשואה, בלי חדרים והתחדשות עירונית', () => {
    const result = values(
      parseDetailsForm(form({ ...SHOP, commercial_use: 'חנות', annual_yield: '4.5' })),
    );

    expect(result.rooms).toBeNull();
    expect(result.commercial_use).toBe('חנות');
    expect(result.annual_yield).toBe(4.5);
    expect(result.parking_count).toBe(2);
    expect(result.has_parking).toBe(true);
    expect(result.urban_renewal_status).toBe('none');
  });

  it('מעבר מדירה לקרקע מנקה את שדות המגורים במקום להשאיר שאריות', () => {
    const result = values(parseDetailsForm(form(LAND)));
    expect(result.has_elevator).toBe(false);
    expect(result.has_safe_room).toBe(false);
    expect(result.building_year).toBeNull();
    expect(result.total_floors).toBeNull();
  });

  it('שטח של קרקע יכול להיות גדול בהרבה מדירה', () => {
    expect(values(parseDetailsForm(form({ ...LAND, size_sqm: '2500' }))).size_sqm).toBe(2500);
    expect(error(parseDetailsForm(form({ ...APARTMENT, size_sqm: '2500' })))).toContain('2000');
  });

  it('פוסל ייעוד תכנוני שאינו מהרשימה', () => {
    expect(error(parseDetailsForm(form({ ...LAND, land_zoning: 'משהו אחר' })))).toContain('ייעוד');
  });
});

describe('parseDetailsForm — זיהוי ומצב משפטי', () => {
  it('חכירה מרמ״י מחייבת מספר חוזה', () => {
    expect(error(parseDetailsForm(form({ ...APARTMENT, right_type: 'lease_rmi' })))).toContain(
      'חוזה החכירה',
    );

    const result = values(
      parseDetailsForm(form({ ...APARTMENT, right_type: 'lease_rmi', lease_contract_no: 'ח-2014/3871' })),
    );
    expect(result.lease_contract_no).toBe('ח-2014/3871');
  });

  it('מספר חוזה חכירה נמחק כשסוג הזכות אינו חכירה', () => {
    const result = values(
      parseDetailsForm(form({ ...APARTMENT, right_type: 'ownership', lease_contract_no: 'ח-1' })),
    );
    expect(result.lease_contract_no).toBeNull();
  });

  it('שומר גוש, חלקה ותת־חלקה', () => {
    const result = values(
      parseDetailsForm(form({ ...APARTMENT, gush: '6212', helka: '118', tat_helka: '14' })),
    );
    expect(result).toMatchObject({ gush: 6212, helka: 118, tat_helka: 14 });
  });

  it('יתרת משכנתא ותום חוזה שכירות נשמרים רק כשסומנה התיבה', () => {
    const withoutFlags = values(
      parseDetailsForm(
        form({ ...APARTMENT, mortgage_balance: '900000', tenant_lease_ends: '2027-09-30' }),
      ),
    );
    expect(withoutFlags.mortgage_balance).toBeNull();
    expect(withoutFlags.tenant_lease_ends).toBeNull();

    const withFlags = values(
      parseDetailsForm(
        form({
          ...APARTMENT,
          has_mortgage: 'on',
          mortgage_balance: '900000',
          has_tenant: 'on',
          tenant_lease_ends: '2027-09-30',
        }),
      ),
    );
    expect(withFlags.mortgage_balance).toBe(900_000);
    expect(withFlags.tenant_lease_ends).toBe('2027-09-30');
  });
});

describe('parseDetailsForm — חלון הפינוי', () => {
  it('פוסל חלון הפוך', () => {
    expect(
      error(
        parseDetailsForm(
          form({ ...APARTMENT, available_from: '2027-11-01', available_until: '2027-05-01' }),
        ),
      ),
    ).toContain('מאוחר');
  });

  it('מקבל חלון תקין עם גמישות', () => {
    const result = values(
      parseDetailsForm(
        form({
          ...APARTMENT,
          available_from: '2027-05-01',
          available_until: '2027-11-01',
          availability_flex_months: '3',
        }),
      ),
    );
    expect(result).toMatchObject({
      available_from: '2027-05-01',
      available_until: '2027-11-01',
      availability_flex_months: 3,
    });
  });

  it('פוסל תאריך שאינו בפורמט של שדה תאריך', () => {
    expect(error(parseDetailsForm(form({ ...APARTMENT, available_from: '1.5.2027' })))).toContain(
      'תאריך',
    );
  });
});

describe('שפת הודעות השגיאה', () => {
  it('כל שגיאה שמוצגת למשתמש היא בעברית, גם כשהשדה חסר לגמרי', () => {
    const broken: FormData[] = [
      form({}),
      form({ asset_type: 'apartment' }),
      form({ ...APARTMENT, size_sqm: '' }),
      form({ ...APARTMENT, rooms: '' }),
      form({ ...APARTMENT, availability_flex_months: 'הרבה' }),
      form({ ...APARTMENT, parking_count: 'שתיים' }),
      form({ ...APARTMENT, condition: 'excellent' }),
      form({ ...SHOP, annual_yield: '400' }),
    ];

    for (const data of broken) {
      const message = error(parseDetailsForm(data));
      expect(message, message).not.toMatch(/[A-Za-z]{3}/);
    }

    for (const data of [form({}), form({ wanted_asset_types: 'apartment', wanted_cities: 'רעננה' })]) {
      const result = parseWantedForm(data);
      if ('error' in result) expect(result.error, result.error).not.toMatch(/[A-Za-z]{3}/);
    }
  });
});

describe('parseWantedForm', () => {
  const WANTED = {
    wanted_asset_types: 'apartment',
    wanted_cities: 'הרצליה',
    cash_add_max: '400000',
    cash_receive_min: '0',
  };

  function wanted(result: ReturnType<typeof parseWantedForm>) {
    if ('error' in result) throw new Error(`ציפינו להצלחה: ${result.error}`);
    return result.values;
  }

  it('דורש סוג נכס אחד לפחות ועיר אחת לפחות', () => {
    expect(error(parseWantedForm(form(without(WANTED, 'wanted_asset_types'))))).toContain(
      'סוג נכס',
    );
    expect(error(parseWantedForm(form(without(WANTED, 'wanted_cities'))))).toContain('אזור');
  });

  it('אוסף כמה סוגי נכס וכמה ערים', () => {
    const result = wanted(
      parseWantedForm(
        form({
          ...WANTED,
          wanted_asset_types: ['apartment', 'shop'],
          wanted_cities: ['הרצליה', 'רעננה'],
        }),
      ),
    );
    expect(result.wanted_asset_types).toEqual(['apartment', 'shop']);
    expect(result.wanted_cities).toEqual(['הרצליה', 'רעננה']);
  });

  it('מתעלם מסוג נכס שאינו מוכר', () => {
    const result = wanted(
      parseWantedForm(form({ ...WANTED, wanted_asset_types: ['apartment', 'castle'] })),
    );
    expect(result.wanted_asset_types).toEqual(['apartment']);
  });

  it('פוסל טווח חדרים, טווח שווי וחלון זמן הפוכים', () => {
    expect(
      error(parseWantedForm(form({ ...WANTED, wanted_min_rooms: '5', wanted_max_rooms: '3' }))),
    ).toContain('חדרים');
    expect(
      error(
        parseWantedForm(form({ ...WANTED, wanted_value_min: '5000000', wanted_value_max: '3000000' })),
      ),
    ).toContain('שווי');
    expect(
      error(
        parseWantedForm(
          form({
            ...WANTED,
            wanted_available_from: '2028-01-01',
            wanted_available_until: '2027-01-01',
          }),
        ),
      ),
    ).toContain('מאוחר');
  });

  it('ללא שכונות מסומנות — כל העיר', () => {
    expect(wanted(parseWantedForm(form(WANTED))).wanted_neighborhood_ids).toEqual([]);
  });

  it('שומר קומה מינימלית וטווח שווי', () => {
    const result = wanted(
      parseWantedForm(
        form({
          ...WANTED,
          wanted_min_floor: '1',
          wanted_value_min: '3000000',
          wanted_value_max: '4500000',
        }),
      ),
    );
    expect(result).toMatchObject({
      wanted_min_floor: 1,
      wanted_value_min: 3_000_000,
      wanted_value_max: 4_500_000,
    });
  });
});

describe('parseSoftPrefs', () => {
  it('ממלא את כל שבע ההעדפות, וברירת המחדל היא 0', () => {
    const prefs = parseSoftPrefs(form({ soft_elevator: '3', soft_parking: '2' }));
    expect(prefs).toEqual({
      elevator: 3,
      parking: 2,
      balcony: 0,
      safe_room: 0,
      new_building: 0,
      renovated: 0,
      urban_renewal: 0,
    });
  });

  it('ערך מחוץ לטווח 0–3 נחשב 0', () => {
    expect(parseSoftPrefs(form({ soft_elevator: '7' })).elevator).toBe(0);
    expect(parseSoftPrefs(form({ soft_elevator: '-1' })).elevator).toBe(0);
    expect(parseSoftPrefs(form({ soft_elevator: 'שלוש' })).elevator).toBe(0);
  });
});

describe('valueSchema', () => {
  it('דורש שווי מוצהר בטווח סביר', () => {
    expect(valueSchema.safeParse({ asking_value: '50000', description: '' }).success).toBe(false);
    const ok = valueSchema.safeParse({ asking_value: '4500000', description: '  ' });
    expect(ok.success).toBe(true);
    expect(ok.success && ok.data).toEqual({ asking_value: 4_500_000, description: null });
  });
});
