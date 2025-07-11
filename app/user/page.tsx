'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/UserContext';
import { useRouter } from 'next/navigation';

type HistoryItem = {
  date: string;
  start: string;
  stops: string[];
  total: number;
};

export default function UserPage() {
  const { user } = useUser();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push('/');
      return;
    }
    try {
      const stored = localStorage.getItem('history');
      if (stored) {
        const parsed: HistoryItem[] = JSON.parse(stored).map((h: any) => ({
          ...h,
          total: h.total ?? 0,
        }));
        setHistory(parsed);
      }
    } catch {}
  }, [user, router]);

  if (user === undefined || !user) return null;

  const loadRun = (item: HistoryItem) => {
    localStorage.setItem('startAddress', item.start);
    localStorage.setItem('bulkAddresses', item.stops.join('\n'));
    router.push('/');
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Account</h1>
      <div>Name: {user.name}</div>
      <div>Email: {user.email}</div>
      <div>Status: {user.status || 'Free'}</div>
      <h2 className="text-lg font-semibold mt-4">History</h2>
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white">
              <th className="p-2">#</th>
              <th className="p-2">Date</th>
              <th className="p-2">Start Address</th>
              <th className="p-2 text-center">Stops</th>
              <th className="p-2 text-center">Total Time</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 5).map((h, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">{new Date(h.date).toLocaleString()}</td>
                <td className="p-2 whitespace-nowrap">{h.start}</td>
                <td className="p-2 text-center">{h.stops.length}</td>
                <td className="p-2 text-center">{h.total} mins</td>
                <td className="p-2">
                  <button className="text-blue-600 hover:underline" onClick={() => loadRun(h)}>
                    Load
                  </button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td className="p-2" colSpan={6}>
                  No history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
