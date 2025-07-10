'use client';
import { useRef } from 'react';
import { useTextField } from 'react-aria';

interface Props {
  id?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}

export default function TextInput({
  id,
  type = 'text',
  value,
  onChange,
  label,
  placeholder,
  autoComplete,
  className,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const { labelProps, inputProps } = useTextField(
    {
      id,
      label,
      type,
      value,
      onChange,
      placeholder,
      autoComplete,
      inputElementType: 'input',
    },
    ref
  );

  return (
    <div className={className}>
      {label && (
        <label {...labelProps} className="mb-1 block">
          {label}
        </label>
      )}
      <input
        {...inputProps}
        ref={ref}
        className="border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}
