'use client';
import { useRef } from 'react';

export interface Stop {
  id: string;
  address: string;
  time: number;
  eta?: string;
  etd?: string;
  job?: string;
}

interface Props {
  stop: Stop;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onTimeChange: (time: number) => void;
}

export default function StopRow({ stop, onRemove, onDragStart, onDrop, onTimeChange }: Props) {
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
      <td className="p-2">
        <input
          type="number"
          value={stop.time}
          onChange={(e) => onTimeChange(parseInt(e.target.value) || 0)}
          className="border px-1 py-0.5 w-16 rounded"
        />
      </td>
      <td className="p-2">{stop.eta || '-'}</td>
      <td className="p-2">{stop.etd || '-'}</td>
      <td className="p-2 text-right">
        <button onClick={onRemove}>Remove</button>
      </td>
    </tr>
  );
}
