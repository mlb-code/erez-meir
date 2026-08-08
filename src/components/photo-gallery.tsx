'use client';

import { useState } from 'react';
import { photoUrl } from '@/lib/format';
import type { ListingPhoto } from '@/lib/types';

export function PhotoGallery({ photos, alt }: { photos: ListingPhoto[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className="flex aspect-16/10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        אין תמונות למודעה הזו
      </div>
    );
  }

  const current = photos[Math.min(index, photos.length - 1)];
  const move = (delta: number) =>
    setIndex((value) => (value + delta + photos.length) % photos.length);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        <img
          src={photoUrl(current.storage_path)}
          alt={alt}
          className="aspect-16/10 w-full object-cover"
        />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="התמונה הקודמת"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-800 shadow transition-colors hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="התמונה הבאה"
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-800 shadow transition-colors hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="num absolute bottom-3 left-3 rounded-lg bg-slate-900/70 px-2 py-1 text-xs font-semibold text-white">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="scroll-fade mt-3 flex gap-2 overflow-x-auto">
          {photos.map((photo, photoIndex) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setIndex(photoIndex)}
              aria-label={`תמונה ${photoIndex + 1}`}
              aria-current={photoIndex === index}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                photoIndex === index ? 'border-brand-600' : 'border-transparent opacity-70'
              }`}
            >
              <img
                src={photoUrl(photo.storage_path)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
