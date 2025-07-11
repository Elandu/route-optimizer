'use client';
import StopRow, { Stop } from './StopRow';
import { DateTime } from 'luxon';

function indexToLabel(i: number) {
  return String.fromCharCode('A'.charCodeAt(0) + i);
}

function dayLabel(day: number | undefined, start: string) {
  const d = day ?? 1;
  const date = DateTime.fromISO(start).plus({ days: d - 1 });
  return `Day ${d} - ${date.toLocaleString(DateTime.DATE_SHORT)}`;
}

interface Props {
  stops: Stop[];
  startDate: string;
  draggingId: string | null;
  remove: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onTimeChange: (id: string, time: number) => void;
  hoveredIndex: number | null;
  selectedIndex: number | null;
  onHover: (idx: number | null) => void;
  onSelect: (idx: number) => void;
}

export default function RunTable({
  stops,
  startDate,
  draggingId,
  remove,
  onDragStart,
  onDrop,
  onTimeChange,
  hoveredIndex,
  selectedIndex,
  onHover,
  onSelect,
}: Props) {
  return (
    <div className="h-full overflow-y-auto scroll-touch min-h-0">
      <table className="w-full text-sm border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-xs sticky top-0 z-10">
            <th className="p-2 text-center">#</th>
            <th className="p-2 text-left">Stop</th>
            <th className="p-2 text-left">Time (min)</th>
            <th className="p-2 text-left">ETA</th>
            <th className="p-2 text-left">ETD</th>
            <th className="p-2 text-left">Travel Time to Next</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let lbl = 0;
            return stops.map((s, idx) => {
              const showDay = idx === 0 || stops[idx - 1].day !== s.day;
              return (
                <>
                  {showDay && (
                    <tr className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 uppercase tracking-wider text-xs sticky top-8 z-10">
                      <td className="p-2" colSpan={7}>{dayLabel(s.day, startDate)}</td>
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
                    label={!s.isStart ? indexToLabel(lbl++) : ''}
                    travelNext={s.travelNext}
                    hovered={hoveredIndex === idx}
                    selected={selectedIndex === idx}
                    onHover={(h) => onHover(h ? idx : null)}
                    onSelect={() => onSelect(idx)}
                  />
                </>
              );
            });
          })()}
        </tbody>
      </table>
    </div>
  );
}
