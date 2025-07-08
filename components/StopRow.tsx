'use client';
import { useRef } from 'react';

export interface Stop {
  id: string;
  address: string;
  time: number;
  eta?: string;
  etd?: string;
  etaIso?: string;
  etdIso?: string;
  day?: number;
  isAccom?: boolean;
}

interface Props {
  stop: Stop;
  dragging: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onTimeChange: (time: number) => void;
}

export default function StopRow({ stop, dragging, onRemove, onDragStart, onDrop, onTimeChange }: Props) {
  const ref = useRef<HTMLTableRowElement>(null);
  return (
    <tr
      ref={ref}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`border-b cursor-move ${dragging ? 'opacity-50' : ''} ${stop.isAccom ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
    >
      <td className="p-2">☰</td>
      <td className="p-2">{stop.address}</td>
      <td className="p-2">
        <input
          type="number"
          value={stop.time}
          onChange={(e) => onTimeChange(parseInt(e.target.value) || 0)}
          className="border px-3 py-2 rounded w-16 dark:bg-gray-800 dark:text-white"
        />
      </td>
      <td className="p-2">{stop.eta || '-'}</td>
      <td className="p-2">{stop.etd || '-'}</td>
      <td className="p-2 text-right">
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800"
          title="Remove stop"
        >
          ❌
        </button>
      </td>
    </tr>
  );
}
