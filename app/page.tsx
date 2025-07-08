'use client';
import { useState, useEffect, useMemo } from 'react';
import AddressInput from '../components/AddressInput';
import RunTable from '../components/RunTable';
import ShareModal from '../components/ShareModal';
import AuthHeader from '../components/AuthHeader';
import MapView from '../components/MapView';
import { encrypt } from '../lib/encryption';
import { addMinutes, formatTime, parseTime } from '../lib/time';
import Script from 'next/script';

interface Stop {
  id: string;
  address: string;
  time: number;
  eta?: string;
  etd?: string;
  job?: string;
}

declare global {
  interface Window {
    grecaptcha?: any;
    google?: any;
  }
}

export default function Page() {
  const [startAddress, setStartAddress] = useState('');
  const [address, setAddress] = useState('');
  const [bulkAddresses, setBulkAddresses] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [time, setTime] = useState(60);
  const [shareUrl, setShareUrl] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const MAX_STOPS = 20;

  const cleanLines = (text: string) =>
    text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');

  const updateBulkAddresses = (text: string) => {
    const lines = cleanLines(text);
    if (lines.length > MAX_STOPS) {
      alert(`Maximum ${MAX_STOPS} stops allowed`);
    }
    setBulkAddresses(lines.slice(0, MAX_STOPS).join('\n'));
  };

  const stopsWithTimes = useMemo(() => {
    if (stops.some((s) => s.eta)) return stops;
    const start = parseTime('09:00');
    let current = start;
    return stops.map((s) => {
      const eta = formatTime(current);
      current = addMinutes(current, s.time);
      const etd = formatTime(current);
      return { ...s, eta, etd };
    });
  }, [stops]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('startAddress') : null;
    if (saved) setStartAddress(saved);
  }, []);

  const saveStart = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('startAddress', startAddress);
    }
  };

  const addAddressLine = () => {
    if (!address.trim()) return;
    const newline = bulkAddresses ? `\n${address}` : address;
    updateBulkAddresses(bulkAddresses + newline);
    setAddress('');
  };

  const onDragStart = (id: string) => setDragging(id);

  const onDrop = (id: string) => {
    if (!dragging || dragging === id) return;
    const newStops = [...stops];
    const from = newStops.findIndex((s) => s.id === dragging);
    const to = newStops.findIndex((s) => s.id === id);
    const [item] = newStops.splice(from, 1);
    newStops.splice(to, 0, item);
    setStops(newStops);
    setDragging(null);
  };

  const changeTime = (id: string, t: number) => {
    setStops(stops.map(s => s.id === id ? { ...s, time: t } : s));
  };

  const remove = (id: string) => setStops(stops.filter(s => s.id !== id));

  const generateRoute = () => {
    const addrs = cleanLines(bulkAddresses);
    if (addrs.length === 0 || !startAddress.trim()) {
      alert('Please provide an address first');
      return;
    }
    const baseStops = addrs.map(addr => ({ id: Date.now().toString() + Math.random(), address: addr, time }));
    setStops(baseStops);
    if (!window.google) return;
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      {
        origin: startAddress,
        destination: startAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        waypoints: baseStops.map(s => ({ location: s.address, stopover: true }))
      },
      (res: google.maps.DirectionsResult, status: string) => {
        if (status !== 'OK' || !res.routes || !res.routes[0]) {
          console.error('Route calculation failed:', status, res);
          alert('Failed to generate route. Please check addresses.');
          return;
        }
        const order = res.routes[0].waypoint_order;
        const ordered = order.map((i: number) => baseStops[i]);
        const legs = res.routes[0].legs;
        let current = parseTime('09:00');
        const withTimes = ordered.map((stop, idx) => {
          const leg = legs[idx];
          if (leg && leg.duration) {
            current = addMinutes(current, leg.duration.value / 60);
          }
          const eta = formatTime(current);
          current = addMinutes(current, stop.time);
          const etd = formatTime(current);
          return { ...stop, eta, etd };
        });
        setStops(withTimes);
        setDirections(res);
      }
    );
  };

  const generateShare = async () => {
    if (!window.grecaptcha) return;
    const token = await window.grecaptcha.execute(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
      { action: 'share' }
    );
    const verify = await fetch('/api/verify-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(r => r.json());
    if (!verify.success) {
      alert('reCAPTCHA failed');
      return;
    }
    const data = JSON.stringify(stops);
    const enc = await encrypt(data, 'demo');
    setShareUrl(`${window.location.origin}?d=${encodeURIComponent(enc)}`);
  };

  return (
    <div>
      <AuthHeader />
      <main className="p-4 max-w-2xl mx-auto">
        <div className="flex gap-2 mb-2">
          <AddressInput value={startAddress} onChange={setStartAddress} placeholder="Start address" />
          <button onClick={saveStart} className="px-4 py-2 border rounded">Save</button>
        </div>
        <div className="flex gap-2 items-center mb-2">
          <AddressInput value={address} onChange={setAddress} placeholder="Add address" />
          <input
            type="number"
            value={time}
            onChange={(e) => setTime(parseInt(e.target.value) || 0)}
            className="border px-2 py-1 rounded w-24"
          />
          <button onClick={addAddressLine} className="px-4 py-2 border rounded">Add</button>
        </div>
        <div className="mb-2">
          <textarea
            value={bulkAddresses}
            onChange={(e) => updateBulkAddresses(e.target.value)}
            placeholder="One address per line"
            className="border px-2 py-1 rounded w-full h-40"
          />
        </div>
        <MapView start={startAddress} stops={stops} directions={directions} />
        <RunTable
          stops={stopsWithTimes}
          remove={remove}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onTimeChange={changeTime}
        />
        <div className="mt-4 flex gap-2">
          <button onClick={generateRoute} className="px-4 py-2 border rounded">Generate Run</button>
          {stops.length > 0 && <ShareModal url={shareUrl} onShare={generateShare} />}
        </div>
      </main>
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=en-AU&region=AU`} />
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} />
    </div>
  );
}
