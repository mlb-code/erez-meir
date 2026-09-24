import { Logo, LogoLockup } from '@/components/logo';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CheckboxChip,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Textarea,
} from '@/components/ui';

/**
 * גלריית מערכת העיצוב. אותה קומפוננטה משרתת גם את /design וגם את
 * /design/mobile — וכך הקטע ברוחב 390 מראה בדיוק את אותו קוד, אבל
 * בתוך חלון צר באמת, כך שנקודות השבירה נפתרות למובייל ולא לדסקטופ.
 */

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="text-heading text-ink-900">{title}</h2>
      {note && <p className="mt-1 text-caption text-ink-500">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Swatches({ title, names, classes }: { title: string; names: string[]; classes: string[] }) {
  return (
    <div>
      <p className="mb-2 text-caption font-semibold text-ink-700">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {classes.map((cls, index) => (
          <div key={cls} className="w-14">
            <div className={`h-10 rounded-chip border border-line ${cls}`} />
            <p className="num mt-1 text-center text-xs text-ink-500">{names[index]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

export function Showcase() {
  return (
    <div className="flex flex-col gap-8">
      <Section title="הסימן" note="צבע אחד, בלי גרדיאנט. הגגות הם חורים שקופים ולא צבע שני.">
        <div className="flex flex-wrap items-end gap-6">
          {[
            { size: 'h-4 w-4', label: '16px' },
            { size: 'h-6 w-6', label: '24px' },
            { size: 'h-8 w-8', label: '32px' },
            { size: 'h-12 w-12', label: '48px' },
            { size: 'h-20 w-20', label: '80px' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <Logo className={`${item.size} text-brand-600`} />
              <p className="mt-2 text-xs text-ink-500">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <LogoLockup />
          <div className="rounded-card bg-brand-700 p-4">
            <LogoLockup markClassName="h-9 w-9 text-white" textClassName="text-heading text-white" />
          </div>
          <div className="rounded-card bg-ink-900 p-4">
            <LogoLockup markClassName="h-9 w-9 text-brand-400" textClassName="text-heading text-white" />
          </div>
        </div>
      </Section>

      <Section title="פלטה" note="שישה תפקידים ועוד שלושה ניטרלים. כל צבע בממשק חייב לבוא מכאן.">
        <div className="flex flex-col gap-5">
          <Swatches
            title="ראשי — brand"
            names={STEPS}
            classes={[
              'bg-brand-50',
              'bg-brand-100',
              'bg-brand-200',
              'bg-brand-300',
              'bg-brand-400',
              'bg-brand-500',
              'bg-brand-600',
              'bg-brand-700',
              'bg-brand-800',
              'bg-brand-900',
            ]}
          />
          <Swatches
            title="משני — chain (מעגלי החלפה)"
            names={STEPS}
            classes={[
              'bg-chain-50',
              'bg-chain-100',
              'bg-chain-200',
              'bg-chain-300',
              'bg-chain-400',
              'bg-chain-500',
              'bg-chain-600',
              'bg-chain-700',
              'bg-chain-800',
              'bg-chain-900',
            ]}
          />
          <Swatches
            title="הצלחה — success"
            names={STEPS}
            classes={[
              'bg-success-50',
              'bg-success-100',
              'bg-success-200',
              'bg-success-300',
              'bg-success-400',
              'bg-success-500',
              'bg-success-600',
              'bg-success-700',
              'bg-success-800',
              'bg-success-900',
            ]}
          />
          <Swatches
            title="אזהרה — warning"
            names={STEPS}
            classes={[
              'bg-warning-50',
              'bg-warning-100',
              'bg-warning-200',
              'bg-warning-300',
              'bg-warning-400',
              'bg-warning-500',
              'bg-warning-600',
              'bg-warning-700',
              'bg-warning-800',
              'bg-warning-900',
            ]}
          />
          <Swatches
            title="שגיאה — danger"
            names={STEPS}
            classes={[
              'bg-danger-50',
              'bg-danger-100',
              'bg-danger-200',
              'bg-danger-300',
              'bg-danger-400',
              'bg-danger-500',
              'bg-danger-600',
              'bg-danger-700',
              'bg-danger-800',
              'bg-danger-900',
            ]}
          />
          <Swatches
            title="ניטרלי — ink"
            names={[...STEPS, '950']}
            classes={[
              'bg-ink-50',
              'bg-ink-100',
              'bg-ink-200',
              'bg-ink-300',
              'bg-ink-400',
              'bg-ink-500',
              'bg-ink-600',
              'bg-ink-700',
              'bg-ink-800',
              'bg-ink-900',
              'bg-ink-950',
            ]}
          />
          <Swatches
            title="ניטרלי — קווים ומשטחים"
            names={['line', 'חזק', 'משטח', 'דף']}
            classes={['bg-line', 'bg-line-strong', 'bg-surface', 'bg-canvas']}
          />
        </div>
      </Section>

      <Section title="טיפוגרפיה" note="חמישה גדלים. display ו-title נוזליים (clamp) ולכן גדלים עם רוחב המסך. Heebo, גובה שורה נדיב — עברית ללא ניקוד צריכה אוויר.">
        <div className="flex flex-col gap-3">
          <p className="text-display text-ink-900">display · 32→48 — כותרת ראשית</p>
          <p className="text-title text-ink-900">title · 24→28 — כותרת עמוד</p>
          <p className="text-heading text-ink-900">heading · 18 — כותרת מקטע</p>
          <p className="text-body text-ink-700">
            body · 16 — טקסט רגיל. במקום למכור דירה ואז לקנות אחרת, מפרסמים את הדירה להחלפה
            ומגדירים מה מחפשים בתמורה.
          </p>
          <p className="text-caption text-ink-500">caption · 14 — טקסט עזר, תוויות והערות</p>
        </div>
      </Section>

      <Section title="כפתורים" note="ארבעה וריאנטים, שלושה גדלים, מצב טעינה ומצב מנוטרל.">
        <div className="flex flex-col gap-5">
          {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <span className="w-20 shrink-0 text-caption text-ink-500">{variant}</span>
              <Button variant={variant} size="sm">
                קטן
              </Button>
              <Button variant={variant} size="md">
                בינוני
              </Button>
              <Button variant={variant} size="lg">
                גדול
              </Button>
              <Button variant={variant} loading loadingLabel="שומר…">
                טעינה
              </Button>
              <Button variant={variant} disabled>
                מנוטרל
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-20 shrink-0 text-caption text-ink-500">קישור</span>
            <ButtonLink href="/design">כפתור שהוא קישור</ButtonLink>
          </div>
          <Button fullWidth size="lg">
            רוחב מלא
          </Button>
        </div>
      </Section>

      <Section title="שדות" note="לכל שדה תווית, ואופציונלית טקסט עזר או שגיאה. אותו גובה לכולם.">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="שם מלא" name="demo_name" defaultValue="ישראל ישראלי" />
            <Input
              label="טלפון"
              name="demo_phone"
              hint="נחשף רק למי שאישר איתך את אותה החלפה."
              defaultValue="050-1234567"
              dir="ltr"
              inputClassName="text-left"
            />
            <Input label="שטח במ״ר" name="demo_sqm" type="number" error="חובה למלא שטח." />
            <Input label="שדה מנוטרל" name="demo_off" defaultValue="לא ניתן לעריכה" disabled />
            <Select label="עיר" name="demo_city" defaultValue="תל אביב">
              <option>תל אביב</option>
              <option>רמת גן</option>
              <option>הרצליה</option>
            </Select>
            <Select label="בחירה שגויה" name="demo_bad" error="צריך לבחור ערך." defaultValue="">
              <option value="">בחירה</option>
              <option value="a">אפשרות</option>
            </Select>
          </div>
          <Textarea
            label="תיאור הדירה"
            name="demo_desc"
            hint="לא חובה, אבל מודעה עם תיאור מקבלת הרבה יותר פניות."
            placeholder="שלושה חדרים משופצים, מרפסת שמש פונה לדרום…"
          />
          <div>
            <p className="mb-2 text-caption font-semibold text-ink-700">מה יש בדירה</p>
            <div className="flex flex-wrap gap-2">
              <CheckboxChip name="demo_f" value="elevator" label="מעלית" defaultChecked />
              <CheckboxChip name="demo_f" value="parking" label="חניה" />
              <CheckboxChip name="demo_f" value="balcony" label="מרפסת" defaultChecked />
              <CheckboxChip name="demo_f" value="mamad" label="ממ״ד" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="כרטיסים">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="רגיל" action={<Badge tone="brand">תג</Badge>}>
            <p className="text-caption text-ink-600">משטח לבן עם קו וצל עדין. ברירת המחדל.</p>
          </Card>
          <Card tone="brand" title="מותגי">
            <p className="text-caption text-brand-900">להדגשת המידע שמבדיל את חליפין.</p>
          </Card>
          <Card tone="muted" title="מושתק">
            <p className="text-caption text-ink-600">למידע משני, כמו הבהרה משפטית.</p>
          </Card>
          <Card tone="outline" title="מתאר">
            <p className="text-caption text-ink-600">קו מקווקו — למשהו שעוד לא קיים.</p>
          </Card>
        </div>
      </Section>

      <Section title="תגים">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">טיוטה</Badge>
          <Badge tone="brand">התאמה ישירה</Badge>
          <Badge tone="chain">שרשרת של 3</Badge>
          <Badge tone="success">פעילה</Badge>
          <Badge tone="warning">ממתינה לאימות</Badge>
          <Badge tone="danger">נדחתה</Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="brand" size="md">
            גודל md
          </Badge>
          <Badge tone="chain" size="md">
            גודל md
          </Badge>
        </div>
      </Section>

      <Section title="התראות" note="לכל מצב יש גם אייקון, לא רק צבע.">
        <div className="flex flex-col gap-3">
          <Alert tone="info">ההתאמות מתעדכנות בכל פעם שמתפרסמת או מתעדכנת מודעה.</Alert>
          <Alert tone="success" title="המודעה פורסמה">
            כבר עכשיו מצאנו שתי התאמות עבורך.
          </Alert>
          <Alert tone="warning" title="ממתין לאימות בעלות">
            העלית נסח טאבו. נבדוק אותו ונעדכן אותך תוך שני ימי עסקים.
          </Alert>
          <Alert tone="error">הנוסח שהוצג אינו תואם לנוסח בשרת. יש לרענן את הדף.</Alert>
        </div>
      </Section>

      <Section title="מצב ריק">
        <EmptyState
          title="עוד לא פרסמת מודעה"
          description="ברגע שתפרסם, נתחיל לחפש עבורך התאמות ומעגלי החלפה."
          action={<ButtonLink href="/new">לפרסום מודעה</ButtonLink>}
        />
      </Section>

      <Section title="שלדי טעינה">
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-11 w-full rounded-field" />
            <SkeletonText lines={4} />
          </div>
        </div>
      </Section>

      <Section title="ראש עמוד">
        <Card padding="lg">
          <PageHeader
            title="ההתאמות שלי"
            description="כאן מופיעות ההחלפות שהמערכת מצאה — גם כאלה שמערבות שלושה וארבעה בעלי דירות."
            backHref="/design"
            backLabel="חזרה"
            actions={<Button variant="secondary">חיפוש התאמות מחדש</Button>}
          />
        </Card>
      </Section>

      <Section title="רדיוסים וצללים">
        <div className="flex flex-wrap gap-4">
          {[
            { cls: 'rounded-chip', label: 'chip · 8' },
            { cls: 'rounded-field', label: 'field · 12' },
            { cls: 'rounded-card', label: 'card · 16' },
            { cls: 'rounded-panel', label: 'panel · 24' },
            { cls: 'rounded-pill', label: 'pill' },
          ].map((item) => (
            <div key={item.cls} className="text-center">
              <div className={`h-16 w-16 border border-line bg-brand-100 ${item.cls}`} />
              <p className="mt-1 text-xs text-ink-500">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          {[
            { cls: 'shadow-card', label: 'card' },
            { cls: 'shadow-raised', label: 'raised' },
            { cls: 'shadow-overlay', label: 'overlay' },
          ].map((item) => (
            <div key={item.cls} className="text-center">
              <div className={`h-16 w-28 rounded-card bg-surface ${item.cls}`} />
              <p className="mt-2 text-xs text-ink-500">{item.label}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
