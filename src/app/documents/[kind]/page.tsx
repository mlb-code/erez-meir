import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { SignDocument } from '@/components/signing/sign-document';
import { Alert, BackLink } from '@/components/ui';
import { maskIdNumber } from '@/lib/signing/render';
import { prepareDocument } from '@/lib/signing/sign';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import type { DocumentKind } from '@/lib/types';

const KINDS: DocumentKind[] = ['terms', 'privacy'];
const TITLES: Partial<Record<DocumentKind, string>> = { terms: 'תנאי השירות', privacy: 'מדיניות הפרטיות' };

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  return { title: TITLES[kind as DocumentKind] ?? 'מסמך', robots: { index: false } };
}

/**
 * צפייה וחתימה על מסמכי החשבון (תנאי שירות, פרטיות). מסמכי נכס ומעגל (הזמנה בכתב,
 * אישור הפגשה) נחתמים בתוך הזרימות שלהם (C3, D4) עם אותה קומפוננטה.
 */
export default async function DocumentPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!KINDS.includes(kind as DocumentKind)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/documents/${kind}`);

  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('full_name, id_number_last4').eq('id', user.id).maybeSingle();
  const vars = { full_name: profile?.full_name ?? '', id_number_masked: maskIdNumber(profile?.id_number_last4) };
  const prepared = await prepareDocument(kind as DocumentKind, vars);
  if (!prepared) notFound();

  const { data: existing } = await supabase.from('signed_documents').select('signed_at')
    .eq('user_id', user.id).eq('kind', kind).eq('template_version', prepared.template.version).limit(1).maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-gutter py-8">
      <BackLink href="/account">חזרה לאזור האישי</BackLink>
      <h1 className="mt-4 text-title text-ink-900">{TITLES[kind as DocumentKind]}</h1>
      {existing && (
        <Alert tone="success" className="mt-3">
          חתמת על גרסה <span className="num">{prepared.template.version}</span> ב-
          <span className="num">
            {new Date(existing.signed_at).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' })}
          </span>
          .
        </Alert>
      )}
      <div className="mt-5">
        <SignDocument kind={kind as DocumentKind} title={prepared.template.title} text={prepared.text} hash={prepared.hash}
          verificationMethod={prepared.verificationMethod} vars={vars} />
      </div>
    </div>
  );
}
