'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AddressInput from '../components/AddressInput';
import RunTable from '../components/RunTable';
import ShareModal from '../components/ShareModal';
import AuthHeader from '../components/AuthHeader';
import MapView from '../components/MapView';
import { encrypt } from '../lib/encryption';
import { addMinutes, formatTime, parseTime } from '../lib/time';
import { DateTime } from 'luxon';
import Script from 'next/script';

interface Stop {
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
  const [shareUrl, setShareUrl] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isOvernight, setIsOvernight] = useState(false);
  const [accomodation, setAccomodation] = useState('');
  const [stats, setStats] = useState<{travel:number; duration:number; avg:number; start:string; end:string} | null>(null);
  const [shouldRecalc, setShouldRecalc] = useState(false);
  const stopsCountRef = useRef(0);

  const MAX_STOPS = 20;
  const BUSINESS_START = parseTime('08:30');
  const BUSINESS_END = parseTime('17:30');

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

  useEffect(() => {
    stopsCountRef.current = stops.length;
  }, [stops.length]);

  const stopsWithTimes = stops;

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
    recalcRoute(newStops);
    setDragging(null);
  };

  const changeTime = (id: string, t: number) => {
    const updated = stops.map(s => s.id === id ? { ...s, time: t } : s);
    setStops(updated);
    recalcRoute(updated);
  };

const remove = (id: string) => {
    const updated = stops.filter(s => s.id !== id);
    setStops(updated);
    recalcRoute(updated);
  };

  const applyAccommodation = useCallback((base: Stop[]) => {
    const without = base.filter(s => s.id !== 'accom');
    if (isOvernight && accomodation.trim()) {
      return [...without, { id: 'accom', address: accomodation, time: 0, isAccom: true }];
    }
    return without;
  }, [isOvernight, accomodation]);

  const applyTimes = useCallback((currStops: Stop[], legs: google.maps.DirectionsLeg[]) => {
    let current = BUSINESS_START;
    let day = 1;
    let travel = 0;
    const result = currStops.map((stop, idx) => {
      const leg = legs[idx];
      if (leg && leg.duration) {
        const min = leg.duration.value / 60;
        travel += min;
        current = addMinutes(current, min);
        if (current > BUSINESS_END) {
          day++;
          current = BUSINESS_START.plus({ days: day - 1 });
        }
      }
      const eta = current;
      current = addMinutes(current, stop.time);
      if (current > BUSINESS_END) {
        day++;
        current = BUSINESS_START.plus({ days: day - 1 });
      }
      const etd = current;
      return {
        ...stop,
        eta: formatTime(eta),
        etd: formatTime(etd),
        etaIso: eta.toISO(),
        etdIso: etd.toISO(),
        day,
      } as Stop;
    });
    const duration = result.length
      ? DateTime.fromISO(result[result.length - 1].etdIso!).diff(DateTime.fromISO(result[0].etaIso!)).as('minutes')
      : 0;
    const avg = result.length ? travel / result.length : 0;
    setStats({
      travel: Math.round(travel),
      duration: Math.round(duration),
      avg: Math.round(avg),
      start: result[0]?.eta ?? '',
      end: result[result.length - 1]?.etd ?? '',
    });
    return result;
  }, [BUSINESS_START, BUSINESS_END]);

  const recalcRoute = useCallback((currStops: Stop[]) => {
    const withAccom = applyAccommodation(currStops);
    if (!window.google || !startAddress) return;
    const svc = new window.google.maps.DirectionsService();
    setDirections(null);
    svc.route(
      {
        origin: startAddress,
        destination: startAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
        waypoints: withAccom.map((s) => ({ location: s.address, stopover: true })),
      },
      (res: google.maps.DirectionsResult, status: string) => {
        if (status !== 'OK' || !res.routes || !res.routes[0]) {
          console.error('Route recalculation failed:', status, res);
          return;
        }
        const legs = res.routes[0].legs;
        const updated = applyTimes(withAccom, legs);
        setStops(updated);
        setDirections(res);
      }
    );
  }, [startAddress, applyAccommodation, applyTimes]);

  useEffect(() => {
    if (shouldRecalc && stops.length > 0) {
      recalcRoute(stops);
      setShouldRecalc(false);
    }
  }, [shouldRecalc, recalcRoute, stops]);

  useEffect(() => {
    if (stopsCountRef.current > 0) setShouldRecalc(true);
  }, [isOvernight, accomodation]);

  const generateRoute = () => {
    const addrs = cleanLines(bulkAddresses);
    if (addrs.length === 0 || !startAddress.trim()) {
      alert('Please provide an address first');
      return;
    }
    const baseStops = addrs.map(addr => ({ id: Date.now().toString() + Math.random(), address: addr, time: 60 }));
    setStops(baseStops);
    if (!window.google) return;
    const svc = new window.google.maps.DirectionsService();
    setDirections(null);
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
        const finalStops = applyAccommodation(ordered);
        recalcRoute(finalStops);
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
          <AddressInput
            value={startAddress}
            onChange={setStartAddress}
            placeholder="Start address"
            title="Starting Address"
            ariaLabel="Starting Address"
          />
          <button
            onClick={saveStart}
            className="px-4 py-2 rounded border text-sm bg-blue-500 text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
        <div className="flex gap-2 items-center mb-2">
          <AddressInput value={address} onChange={setAddress} placeholder="Add address" />
          <button
            onClick={addAddressLine}
            className="px-4 py-2 rounded border text-sm bg-blue-500 text-white hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label>
            <input
              type="checkbox"
              checked={isOvernight}
              onChange={(e) => setIsOvernight(e.target.checked)}
              className="mr-1"
            />
            Overnight
          </label>
          {isOvernight && (
            <AddressInput
              value={accomodation}
              onChange={setAccomodation}
              placeholder="Accomodation address"
            />
          )}
        </div>
        <div className="mb-2">
          <textarea
            value={bulkAddresses}
            onChange={(e) => updateBulkAddresses(e.target.value)}
            placeholder="One address per line"
            className="border px-3 py-2 rounded w-full h-40 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <MapView start={startAddress} stops={stops} directions={directions} />
        <RunTable
          stops={stopsWithTimes}
          draggingId={dragging}
          remove={remove}
          onDragStart={onDragStart}
          onDrop={onDrop}
          onTimeChange={changeTime}
        />
        {stats && (
          <div className="mt-2 text-sm">
            {`Travel time: ${stats.travel} minutes | Avg travel per stop: ${stats.avg} mins`}
            <br />
            {`Total run: ${stats.start} to ${stats.end} (≈${(stats.duration/60).toFixed(1)} hrs)`}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={generateRoute}
            className="px-4 py-2 rounded border text-sm bg-blue-500 text-white hover:bg-blue-600"
          >
            Generate Run
          </button>
          {stops.length > 0 && <ShareModal url={shareUrl} onShare={generateShare} />}
        </div>
      </main>
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=en-AU&region=AU`} />
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} />
    </div>
  );
}
