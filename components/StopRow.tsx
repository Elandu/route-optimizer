'use client';
import { useRef } from 'react';

export interface Stop {
  id: string;
  address: string;
  eta?: string;
  etd?: string;
  job?: string;
}

interface Props {
  stop: Stop;
  onRemove: () => void;
}

export default function StopRow({ stop, onRemove }: Props) {
  const ref = useRef<HTMLTableRowElement>(null);
  return (
    <tr ref={ref} className="border-b">\
      <td className="p-2 cursor-grab">☰</td>
      <td className="p-2">{stop.address}</td>
      <td className="p-2">{stop.job || '-'}</td>
      <td className="p-2 text-right">
        <button onClick={onRemove}>Remove</button>
      </td>
    </tr>
  );
}
