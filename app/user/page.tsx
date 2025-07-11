'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/UserContext';
import { useRouter } from 'next/navigation';

type HistoryItem = {
  date: string;
  start: string;
  stops: string[];
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
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, [user, router]);

  if (user === undefined || !user) return null;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Account</h1>
      <div>Name: {user.name}</div>
      <div>Email: {user.email}</div>
      <div>Status: {user.status || 'Free'}</div>
      <h2 className="text-lg font-semibold mt-4">History</h2>
      <ul className="list-disc pl-4">
        {history.slice(0, 5).map((h, idx) => (
          <li key={idx}>
            {new Date(h.date).toLocaleString()}: {h.stops.join(', ')}
          </li>
        ))}
        {history.length === 0 && <li>No history found.</li>}
      </ul>
    </div>
  );
}
