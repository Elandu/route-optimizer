'use client';
import StopRow, { Stop } from './StopRow';

interface Props {
  stops: Stop[];
  remove: (id: string) => void;
}

export default function RunTable({ stops, remove }: Props) {
  return (
    <table className="w-full border mt-4 text-sm">
      <thead>
        <tr className="bg-gray-200 dark:bg-gray-700">
          <th className="p-2"></th>
          <th className="p-2 text-left">Stop</th>
          <th className="p-2 text-left">Job</th>
          <th className="p-2"></th>
        </tr>
      </thead>
      <tbody>
        {stops.map((s) => (
          <StopRow key={s.id} stop={s} onRemove={() => remove(s.id)} />
        ))}
      </tbody>
    </table>
  );
}
