import type { ComponentPropsWithoutRef } from 'react';

export default function Button({
  type = 'button',
  className = '',
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      {...props}
      type={type}
      className={`h-12 rounded-[8px] bg-lime-action text-[14px] font-extrabold disabled:opacity-50 ${className}`}
    />
  );
}
