'use client';
import { useEffect, useRef } from 'react';
import { useTextField } from 'react-aria';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function AddressInput({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const { inputProps } = useTextField({
    value,
    onChange,
    placeholder,
    inputElementType: 'input',
  }, ref);

  useEffect(() => {
    if (!window.google || !ref.current) return;
    const ac = new window.google.maps.places.Autocomplete(ref.current!, {
      types: ['address'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (place.formatted_address) onChange(place.formatted_address);
    });
  }, []);

  return (
    <input
      {...inputProps}
      ref={ref}
      className="border px-2 py-1 rounded w-full"
    />
  );
}
