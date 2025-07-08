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
  onDragStart: () => void;
  onDrop: () => void;
}

export default function StopRow({ stop, onRemove, onDragStart, onDrop }: Props) {
  const ref = useRef<HTMLTableRowElement>(null);
  return (
    <tr
      ref={ref}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="border-b"
    >
      <td className="p-2 cursor-grab">☰</td>
      <td className="p-2">{stop.address}</td>
      <td className="p-2">{stop.job || '-'}</td>
      <td className="p-2 text-right">
        <button onClick={onRemove}>Remove</button>
      </td>
    </tr>
  );
}
