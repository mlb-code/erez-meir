import type { Metadata } from 'next';
import { Showcase } from '../showcase';

export const metadata: Metadata = {
  title: 'מערכת העיצוב — מובייל',
  robots: { index: false, follow: false },
};

/** היעד של ה-iframe ב-/design. אותה גלריה בדיוק, בחלון צר באמת. */
export default function DesignMobilePage() {
  return (
    <div className="px-gutter py-6">
      <Showcase />
    </div>
  );
}
