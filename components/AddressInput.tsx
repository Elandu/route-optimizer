'use client';
import { useEffect, useRef } from 'react';
import { useTextField } from 'react-aria';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  title?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
};

export default function AddressInput({ value, onChange, placeholder, title, ariaLabel, id, className }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const { inputProps } = useTextField(
    {
      value,
      onChange,
      placeholder,
      'aria-label': ariaLabel,
      inputElementType: 'input',
    },
    ref
  );

  useEffect(() => {
    let ac: google.maps.places.Autocomplete | null = null;
    function init() {
      if (!window.google || !ref.current) return;
      ac = new window.google.maps.places.Autocomplete(ref.current!, { types: ['address'] });
      ac!.addListener('place_changed', () => {
        const place = ac!.getPlace();
        if (place.formatted_address) onChange(place.formatted_address);
      });
    }
    if (window.google) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          init();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [onChange]);

  return (
    <input
      {...inputProps}
      id={id}
      ref={ref}
      title={title}
      className={`border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white ${className ?? ''}`}
    />
  );
}
