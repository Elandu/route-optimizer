'use client';
import StopRow, { Stop } from './StopRow';

function indexToLabel(i: number) {
  return String.fromCharCode('A'.charCodeAt(0) + i);
}

interface Props {
  stops: Stop[];
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
    <table className="min-w-max w-full text-sm border-collapse mt-4">
      <thead>
        <tr className="bg-gray-800 text-white font-semibold text-xs">
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
                  <tr className="bg-gray-900 text-gray-400 uppercase tracking-wider text-xs">
                    <td className="p-2" colSpan={7}>{`Day ${s.day}`}</td>
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
  );
}
