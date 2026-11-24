import { useId, type ComponentPropsWithoutRef } from 'react';

type FormFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'className'> & {
  label: string;
};

export default function FormField({ label, id, placeholder = label, ...props }: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        placeholder={placeholder}
        className="h-12 rounded-[8px] border border-[#dfe0da] px-4 text-[14px] outline-none focus:border-[#111111]"
      />
    </>
  );
}
