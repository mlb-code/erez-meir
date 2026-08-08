'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { FormAlert } from '@/components/form';
import { photoUrl } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import type { ListingPhoto } from '@/lib/types';

const MAX_PHOTOS = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function StepPhotos({
  listingId,
  userId,
  photos,
}: {
  listingId: string;
  userId: string;
  photos: ListingPhoto[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const remaining = MAX_PHOTOS - photos.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(undefined);

    const files = Array.from(fileList);
    if (files.length > remaining) {
      setError(`אפשר להעלות עד ${MAX_PHOTOS} תמונות למודעה. נשארו ${remaining}.`);
      return;
    }
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        setError('אפשר להעלות תמונות מסוג JPG, PNG, WEBP או AVIF בלבד.');
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`הקובץ "${file.name}" גדול מ-5 מגה־בייט.`);
        return;
      }
    }

    setBusy(true);
    const supabase = createClient();
    let order = photos.length;

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${userId}/${listingId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError('העלאת התמונה נכשלה. אפשר לנסות שוב.');
        break;
      }

      const { error: insertError } = await supabase
        .from('listing_photos')
        .insert({ listing_id: listingId, storage_path: path, sort_order: order++ });

      if (insertError) {
        await supabase.storage.from('listing-photos').remove([path]);
        setError('לא הצלחנו לשמור את התמונה במודעה.');
        break;
      }
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
    startTransition(() => router.refresh());
  }

  async function removePhoto(photo: ListingPhoto) {
    setBusy(true);
    const supabase = createClient();
    await supabase.from('listing_photos').delete().eq('id', photo.id);
    if (!photo.storage_path.startsWith('/')) {
      await supabase.storage.from('listing-photos').remove([photo.storage_path]);
    }
    setBusy(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-5">
      <FormAlert error={error} />

      <div>
        <p className="text-sm text-slate-600">
          אפשר להעלות עד {MAX_PHOTOS} תמונות. התמונה הראשונה היא זו שתופיע בלוח.
        </p>

        <label
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 ${
            busy || remaining <= 0 ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-semibold text-slate-700">
            {busy ? 'מעלה…' : remaining > 0 ? 'בחירת תמונות מהמכשיר' : 'הגעת למקסימום התמונות'}
          </span>
          <span className="num text-xs text-slate-500">{photos.length} / {MAX_PHOTOS}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            disabled={busy || remaining <= 0}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="relative overflow-hidden rounded-xl border border-slate-200">
              <img
                src={photoUrl(photo.storage_path)}
                alt=""
                className="aspect-4/3 w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute top-2 right-2 rounded-md bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                  ראשית
                </span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo)}
                disabled={busy}
                aria-label="מחיקת התמונה"
                className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-white"
              >
                מחיקה
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/new?id=${listingId}&step=3`}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-brand-700"
        >
          המשך לשווי המבוקש
        </Link>
        <Link
          href={`/new?id=${listingId}&step=1`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-base font-semibold text-slate-700 hover:bg-slate-50"
        >
          חזרה
        </Link>
      </div>
    </div>
  );
}
