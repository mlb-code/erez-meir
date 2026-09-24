import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoGallery } from '@/components/photo-gallery';
import { BackLink, Badge, Button, ButtonLink, Card } from '@/components/ui';
import {
  ASSET_TYPE_LABELS,
  CONDITION_LABELS,
  FEATURE_LABELS,
  LEGAL_DISCLAIMER,
  RIGHT_TYPE_LABELS,
  URBAN_RENEWAL_LABELS,
  assetGroup,
} from '@/lib/constants';
import { formatCurrency, formatCurrencyExact, formatRooms } from '@/lib/format';
import {
  describeAddress,
  describeAvailability,
  describeCashFlexibility,
  describeLegalStatus,
  describeSoftPrefs,
  describeWantedAssetTypes,
  describeWantedRooms,
  describeWantedValueRange,
  describeWantedWindow,
  listingFeatures,
  listingTitle,
  wantsResidential,
} from '@/lib/listing-text';
import { findMatchWith } from '@/lib/actions/matching';
import { getListingById } from '@/lib/data/listings';
import { getNeighborhoodsByIds } from '@/lib/data/neighborhoods';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { ListingWithPhotos } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: 'מודעה לא נמצאה' };
  return {
    title: `${listingTitle(listing)} להחלפה`,
    description: listing.description ?? undefined,
  };
}

/**
 * טבלת המפרט, לפי סוג הנכס. גוש, חלקה ומספר בית אינם מופיעים כאן בשום מצב —
 * הם נחשפים רק דרך listings_view אחרי חתימה על אישור הפגשה (§4.4).
 */
function buildSpecs(listing: ListingWithPhotos): { label: string; value: string }[] {
  const group = assetGroup(listing.asset_type ?? 'apartment');
  const floor =
    listing.floor === null
      ? '—'
      : listing.total_floors
        ? `${listing.floor} מתוך ${listing.total_floors}`
        : String(listing.floor);

  const specs: { label: string; value: string }[] = [
    { label: 'סוג', value: ASSET_TYPE_LABELS[listing.asset_type ?? 'apartment'] },
  ];

  if (group === 'residential' && listing.rooms !== null) {
    specs.push({ label: 'חדרים', value: formatRooms(listing.rooms) });
  }
  if (group === 'commercial' && listing.commercial_use) {
    specs.push({ label: 'ייעוד', value: listing.commercial_use });
  }

  specs.push({ label: 'שטח', value: `${listing.size_sqm} מ״ר` });

  if (group !== 'land') specs.push({ label: 'קומה', value: floor });
  if (group === 'residential') {
    specs.push({
      label: 'שנת בנייה',
      value: listing.building_year ? String(listing.building_year) : '—',
    });
  }
  if (group !== 'land') {
    specs.push({ label: 'מצב הנכס', value: CONDITION_LABELS[listing.condition] });
  }
  if (group === 'residential') {
    specs.push({
      label: 'התחדשות עירונית',
      value: URBAN_RENEWAL_LABELS[listing.urban_renewal_status],
    });
  }
  if (group === 'commercial' && listing.annual_yield !== null) {
    specs.push({ label: 'תשואה שנתית', value: `${listing.annual_yield}%` });
  }
  if (group === 'land') {
    specs.push({ label: 'ייעוד תכנוני', value: listing.land_zoning ?? '—' });
    specs.push({
      label: 'זכויות בנייה',
      value: listing.building_rights_sqm !== null ? `${listing.building_rights_sqm} מ״ר` : '—',
    });
    specs.push({ label: 'מגודר', value: listing.land_is_fenced ? 'כן' : 'לא' });
    specs.push({ label: 'פנוי מבנייה', value: listing.land_is_vacant ? 'כן' : 'לא' });
  }

  return specs;
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const user = await getCurrentUser();
  const isMine = user?.id === listing.owner_id;

  // האם למשתמש המחובר יש מודעה פעילה משלו — תנאי לכפתור ההתאמה
  let hasActiveListing = false;
  if (user && !isMine) {
    const supabase = await createClient();
    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('status', 'active');
    hasActiveListing = (count ?? 0) > 0;
  }

  const features = listingFeatures(listing);
  const specs = buildSpecs(listing);
  const legalNotes = describeLegalStatus(listing);
  const softPrefs = describeSoftPrefs(listing);
  const valueRange = describeWantedValueRange(listing);

  const wantedNeighborhoods = await getNeighborhoodsByIds(listing.wanted_neighborhood_ids ?? []);
  const wantedAreas = listing.wanted_cities.map((city) => {
    const names = wantedNeighborhoods
      .filter((neighborhood) => neighborhood.city === city)
      .map((neighborhood) => neighborhood.name);
    return names.length ? `${city} (${names.join(', ')})` : `${city} — כל העיר`;
  });

  return (
    <div className="mx-auto max-w-4xl px-gutter py-8">
      <BackLink href="/listings">חזרה ללוח ההחלפות</BackLink>

      <div className="mt-4">
        <PhotoGallery photos={listing.listing_photos} alt={`${listingTitle(listing)}`} />
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title text-ink-900">{listingTitle(listing)}</h1>
          <p className="mt-1 text-body text-ink-500">{describeAddress(listing)}</p>
        </div>
        <div className="text-left">
          <p className="text-title text-brand-700">{formatCurrency(listing.asking_value)}</p>
          <p className="text-xs text-ink-500">{formatCurrencyExact(listing.asking_value)}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
        {specs.map((spec) => (
          <div key={spec.label} className="bg-surface p-4">
            <dt className="text-xs font-semibold text-ink-500">{spec.label}</dt>
            <dd className="mt-1 text-caption font-bold text-ink-900">{spec.value}</dd>
          </div>
        ))}
      </dl>

      {features.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {features.map((feature) => (
            <li key={feature}>
              <Badge tone="neutral" size="md">
                {feature}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {listing.description && (
        <section className="mt-6">
          <h2 className="text-heading text-ink-900">על הנכס</h2>
          <p className="mt-2 text-body leading-relaxed whitespace-pre-line text-ink-700">
            {listing.description}
          </p>
        </section>
      )}

      {/* מצב משפטי וזמינות — מה שמשנה כשבאמת מתקדמים לעסקה */}
      <Card as="section" padding="lg" className="mt-6" title="זכויות, זמינות ומצב משפטי">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-ink-500">סוג הזכות</dt>
            <dd className="mt-1 text-caption font-bold text-ink-900">
              {RIGHT_TYPE_LABELS[listing.right_type]}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-ink-500">חלון מסירה</dt>
            <dd className="mt-1 text-caption font-bold text-ink-900">
              {describeAvailability(listing)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-ink-500">מצב משפטי מוצהר</dt>
            <dd className="mt-1.5 flex flex-wrap gap-2">
              {legalNotes.length ? (
                legalNotes.map((note) => (
                  <Badge key={note} tone="warning" size="md">
                    {note}
                  </Badge>
                ))
              ) : (
                <Badge tone="success" size="md">
                  נקי ממשכנתא, מהערות אזהרה ומעיקולים
                </Badge>
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-ink-500">
          ההצהרה היא של הבעלים, ומוצלבת מול נסח הטאבו בשלב אימות הבעלות.
        </p>
      </Card>

      {/* הבלוק שמבדיל את הפלטפורמה — מה הבעלים רוצה לקבל בתמורה */}
      <Card as="section" tone="brand" padding="lg" className="mt-8 border-2">
        <h2 className="text-heading text-brand-900">מה הבעלים מחפש בתמורה</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-brand-700">סוג הנכס</dt>
            <dd className="mt-1 font-bold text-brand-950">{describeWantedAssetTypes(listing)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-brand-700">אזורים</dt>
            <dd className="mt-1 font-bold text-brand-950">
              {wantedAreas.length ? wantedAreas.join(' · ') : 'כל אזור'}
            </dd>
          </div>
          {wantsResidential(listing) && (
            <div>
              <dt className="text-xs font-semibold text-brand-700">חדרים</dt>
              <dd className="mt-1 font-bold text-brand-950">{describeWantedRooms(listing)}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold text-brand-700">שטח מינימלי</dt>
            <dd className="mt-1 font-bold text-brand-950">
              {listing.wanted_min_sqm !== null ? `${listing.wanted_min_sqm} מ״ר` : 'לא הוגדר'}
            </dd>
          </div>
          {listing.wanted_min_floor !== null && (
            <div>
              <dt className="text-xs font-semibold text-brand-700">קומה מינימלית</dt>
              <dd className="num mt-1 font-bold text-brand-950">{listing.wanted_min_floor}</dd>
            </div>
          )}
          {valueRange && (
            <div>
              <dt className="text-xs font-semibold text-brand-700">טווח שווי מבוקש</dt>
              <dd className="mt-1 font-bold text-brand-950">{valueRange}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold text-brand-700">חלון מעבר</dt>
            <dd className="mt-1 font-bold text-brand-950">{describeWantedWindow(listing)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-brand-700">חובה שיהיה</dt>
            <dd className="mt-1 font-bold text-brand-950">
              {listing.must_haves.length
                ? listing.must_haves.map((feature) => FEATURE_LABELS[feature]).join(' · ')
                : 'ללא דרישות מיוחדות'}
            </dd>
          </div>
          {softPrefs.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-brand-700">חשוב לו, בלי להיות תנאי סף</dt>
              <dd className="mt-1.5 flex flex-wrap gap-2">
                {softPrefs.map((pref) => (
                  <Badge key={pref} tone="brand" size="md">
                    {pref}
                  </Badge>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-4 rounded-field bg-surface/70 px-4 py-3 text-caption font-semibold text-brand-900">
          גמישות מזומן: {describeCashFlexibility(listing)}
        </p>
      </Card>

      {/* קריאה לפעולה */}
      <section className="mt-6">
        {isMine ? (
          <Card padding="lg">
            <p className="text-body font-semibold text-ink-800">זו המודעה שלך.</p>
            <ButtonLink href="/account" variant="secondary" className="mt-3">
              לעריכת המודעה
            </ButtonLink>
          </Card>
        ) : !user ? (
          <Card padding="lg">
            <p className="text-body text-ink-700">
              כדי לבדוק אם הנכס שלך מתאים להחלפה הזו צריך להתחבר ולפרסם מודעה.
            </p>
            <ButtonLink href={`/login?redirect=/listings/${listing.id}`} className="mt-3">
              יש לי נכס שמתאים
            </ButtonLink>
          </Card>
        ) : !hasActiveListing ? (
          <Card padding="lg">
            <p className="text-body text-ink-700">
              כדי להיכנס למעגלי ההחלפה צריך שתהיה לך מודעה פעילה משלך.
            </p>
            <ButtonLink href="/new" className="mt-3">
              לפרסום המודעה שלי
            </ButtonLink>
          </Card>
        ) : (
          <Card padding="lg">
            <form action={findMatchWith}>
              <input type="hidden" name="listing_id" value={listing.id} />
              <p className="text-body text-ink-700">
                נבדוק אם יש בין הנכס שלך לנכס הזה החלפה ישירה, או מעגל שכולל עוד בעלי נכסים.
              </p>
              <Button type="submit" className="mt-3">
                יש לי נכס שמתאים
              </Button>
            </form>
          </Card>
        )}
      </section>

      <p className="mt-6 rounded-field bg-ink-100 p-4 text-xs leading-relaxed text-ink-500">
        {LEGAL_DISCLAIMER}
      </p>
    </div>
  );
}
