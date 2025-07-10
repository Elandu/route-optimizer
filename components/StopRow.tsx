'use client';
import { useRef } from 'react';
import Image from 'next/image';

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
  isStart?: boolean;
  travelNext?: string;
}

interface Props {
  stop: Stop;
  dragging: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onTimeChange: (time: number) => void;
  label: string;
  travelNext?: string;
  hovered?: boolean;
  selected?: boolean;
  onHover?: (hover: boolean) => void;
  onSelect?: () => void;
}

export default function StopRow({
  stop,
  dragging,
  onRemove,
  onDragStart,
  onDrop,
  onTimeChange,
  label,
  travelNext,
  hovered,
  selected,
  onHover,
  onSelect,
}: Props) {
  const ref = useRef<HTMLTableRowElement>(null);
  return (
    <tr
      ref={ref}
      draggable={!stop.isAccom && !stop.isStart}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onClick={onSelect}
      className={`border-b ${dragging ? 'opacity-50' : ''} ${
        stop.isAccom
          ? 'bg-gray-100 dark:bg-gray-900 italic text-gray-600 cursor-default'
          : stop.isStart
            ? 'font-semibold cursor-default'
            : 'cursor-move'
      } ${hovered || selected ? 'bg-gray-700 text-white' : ''}`}
    >
      <td className="p-2 text-center align-middle">
        {!stop.isStart && <span className="inline-block w-4">{label}</span>}
      </td>
      <td className="p-2">
        {stop.isAccom
          ? `🛏️ Overnight Stop - ${stop.address}`
          : stop.isStart && stop.id === 'end'
            ? 'Return to Start / End Location'
            : stop.isStart
              ? 'Start / End Location'
              : stop.address}
      </td>
      <td className="p-2">
        {stop.isStart ? (
          '-'
        ) : (
          <input
            type="number"
            value={stop.time}
            onChange={(e) => onTimeChange(parseInt(e.target.value) || 0)}
            readOnly={stop.isAccom}
            className="border px-3 py-2 rounded w-full box-border appearance-none dark:bg-gray-800 dark:text-white disabled:bg-gray-200"
          />
        )}
      </td>
      <td className="p-2">{stop.eta || '-'}</td>
      <td className="p-2">{stop.etd || '-'}</td>
      <td className="p-2">{travelNext || '-'}</td>
      <td className="p-2 text-right">
        {!(stop.isAccom || stop.isStart) && (
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800"
            title="Remove stop"
          >
            ❌
          </button>
        )}
      </td>
    </tr>
  );
}
