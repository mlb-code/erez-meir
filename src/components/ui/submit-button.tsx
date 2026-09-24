'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './button';

/**
 * כפתור שליחה שיודע לבד מתי הטופס בדרך לשרת. חייב לשבת בתוך <form>.
 * ברירת המחדל היא כפתור ראשי ברוחב מלא — זה הדפוס בכל טפסי האתר.
 */
export function SubmitButton({
  children,
  pendingLabel = 'רגע…',
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  ...props
}: Omit<ButtonProps, 'type' | 'loading' | 'loadingLabel'> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      type="submit"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      loading={pending}
      loadingLabel={pendingLabel}
    >
      {children}
    </Button>
  );
}
