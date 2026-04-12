'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button, type ButtonProps } from '@/shared/ui/button';

interface LinkButtonProps extends Omit<ButtonProps, 'asChild'> {
  href: string;
}

function LinkButton({ href, onClick, disabled, ...props }: LinkButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <Button
      loading={isPending}
      disabled={isPending || disabled}
      onClick={handleClick}
      {...props}
    />
  );
}

export { LinkButton };
export type { LinkButtonProps };
