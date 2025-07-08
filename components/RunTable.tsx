'use client';
import StopRow, { Stop } from './StopRow';

interface Props {
  stops: Stop[];
  draggingId: string | null;
  remove: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onTimeChange: (id: string, time: number) => void;
}

export default function RunTable({ stops, draggingId, remove, onDragStart, onDrop, onTimeChange }: Props) {
  return (
    <table className="w-full border mt-4 text-sm">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-700">
          <th className="p-2"></th>
          <th className="p-2 text-left">Stop</th>
          <th className="p-2 text-left">Time (min)</th>
          <th className="p-2 text-left">ETA</th>
          <th className="p-2 text-left">ETD</th>
          <th className="p-2"></th>
        </tr>
      </thead>
      <tbody>
        {stops.map((s, idx) => {
          const showDay = idx === 0 || stops[idx - 1].day !== s.day;
          return (
            <>
              {showDay && (
                <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <td className="p-2" colSpan={6}>{`Day ${s.day}`}</td>
                </tr>
              )}
              <StopRow
                key={s.id}
                stop={s}
                dragging={draggingId === s.id}
                onRemove={() => remove(s.id)}
                onDragStart={() => onDragStart(s.id)}
                onDrop={() => onDrop(s.id)}
                onTimeChange={(t) => onTimeChange(s.id, t)}
              />
            </>
          );
        })}
      </tbody>
    </table>
  );
}
