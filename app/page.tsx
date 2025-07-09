'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AddressInput from '../components/AddressInput';
import RunTable from '../components/RunTable';
import ShareModal from '../components/ShareModal';
import AuthHeader from '../components/AuthHeader';
import MapView from '../components/MapView';
import Tabs, { TabItem } from '../components/Tabs';
import useMediaQuery from '../lib/useMediaQuery';
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
  isStart?: boolean;
  travelNext?: string;
}

declare global {
  interface Window {
    grecaptcha?: any;
    google?: any;
  }
}

export default function Page() {
  const [startAddress, setStartAddress] = useState('');
  const [startDate, setStartDate] = useState(DateTime.now().toISODate());
  const [startTime, setStartTime] = useState('08:30');
  const [eodTime, setEodTime] = useState('17:00');
  const [address, setAddress] = useState('');
  const [bulkAddresses, setBulkAddresses] = useState('');
  // user provided stops (without start/end or accom rows)
  const [stops, setStops] = useState<Stop[]>([]);
  // calculated stops with timings and extra rows
  const [timedStops, setTimedStops] = useState<Stop[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isOvernight, setIsOvernight] = useState(false);
  const [accomodation, setAccomodation] = useState('');
  const [stats, setStats] = useState<{travel:number; avg:number; stops:number; days:number} | null>(null);
  const [shouldRecalc, setShouldRecalc] = useState(false);
  const stopsCountRef = useRef(0);
  const [currentTab, setCurrentTab] = useState('run');
  const [mapState, setMapState] = useState<{center: google.maps.LatLngLiteral | null; zoom: number | null}>({ center: null, zoom: null });
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isMapVisible = isDesktop || currentTab === 'map';

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

  useEffect(() => {
    stopsCountRef.current = stops.length;
  }, [stops.length]);

  const stopsWithTimes = timedStops;

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('startAddress') : null;
    if (saved) setStartAddress(saved);
  }, []);


  const updateStartAddress = (val: string) => {
    setStartAddress(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('startAddress', val);
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
    if (from === -1 || to === -1) return;
    const [item] = newStops.splice(from, 1);
    newStops.splice(to, 0, item);
    setStops(newStops);
    recalcRoute(newStops);
    setDragging(null);
  };

  const onHoverRow = useCallback((idx: number | null) => setHoveredIdx(idx), []);

  const onSelectRow = useCallback((idx: number) => {
    setSelectedIdx(idx);
  }, []);

  const changeTime = (id: string, t: number) => {
    const updated = stops.map((s) => (s.id === id ? { ...s, time: t } : s));
    setStops(updated);
    recalcRoute(updated);
  };

const remove = (id: string) => {
    const updated = stops.filter((s) => s.id !== id);
    setStops(updated);
    recalcRoute(updated);
  };


  const applyTimes = useCallback(
    (currStops: Stop[], legs: google.maps.DirectionsLeg[]) => {
      let current = DateTime.fromISO(`${startDate}T${startTime}`);
      const [eodHour, eodMinute] = eodTime.split(':').map((n) => parseInt(n, 10));
      const [startHour, startMinute] = startTime.split(':').map((n) => parseInt(n, 10));
      let day = 1;
      let travel = 0;
      const result: Stop[] = [];
      let dayEnd = current.set({ hour: eodHour, minute: eodMinute });

      result.push({
        id: 'start',
        address: startAddress,
        time: 0,
        eta: formatTime(current),
        etd: formatTime(current),
        etaIso: current.toISO() ?? undefined,
        etdIso: current.toISO() ?? undefined,
        day,
        isStart: true,
        travelNext: legs[0]?.duration?.text,
      });

      currStops.forEach((stop, idx) => {
        const leg = legs[idx];
        const travelMin = leg && leg.duration ? leg.duration.value / 60 : 0;
        current = addMinutes(current, travelMin);
        travel += travelMin;
        const eta = current;
        current = addMinutes(current, stop.time);
        const etd = current;
        result.push({
          ...stop,
          eta: formatTime(eta),
          etd: formatTime(etd),
          etaIso: eta.toISO() ?? undefined,
          etdIso: etd.toISO() ?? undefined,
          day,
          travelNext: legs[idx + 1]?.duration?.text,
        });

        if (etd > dayEnd) {
          const overEta = etd;
          const nextStart = overEta.plus({ days: 1 }).set({ hour: startHour, minute: startMinute });
          if (isOvernight && accomodation.trim()) {
            result.push({
              id: `accom-${day}`,
              address: accomodation,
              time: 0,
              eta: formatTime(overEta),
              etd: formatTime(nextStart),
              etaIso: overEta.toISO() ?? undefined,
              etdIso: nextStart.toISO() ?? undefined,
              day,
              isAccom: true,
            });
          }
          day++;
          current = nextStart;
          dayEnd = current.set({ hour: eodHour, minute: eodMinute });
        }
      });

      const lastLeg = legs[currStops.length];
      if (lastLeg && lastLeg.duration) {
        const min = lastLeg.duration.value / 60;
        current = addMinutes(current, min);
        travel += min;
      }

      result.push({
        id: 'end',
        address: startAddress,
        time: 0,
        eta: formatTime(current),
        etd: formatTime(current),
        etaIso: current.toISO() ?? undefined,
        etdIso: current.toISO() ?? undefined,
        day,
        isStart: true,
        travelNext: undefined,
      });

      const avg = currStops.length ? travel / currStops.length : 0;
      setStats({
        travel: Math.round(travel),
        avg: Math.round(avg),
        stops: currStops.length,
        days: day,
      });

      // remove consecutive duplicate start rows on the same day
      return result.filter(
        (s, i, arr) =>
          !(
            s.isStart &&
            i > 0 &&
            arr[i - 1].isStart &&
            arr[i - 1].day === s.day
          )
      );
    },
    [startAddress, startDate, startTime, eodTime, accomodation, isOvernight]
  );

  const recalcRoute = useCallback((currStops: Stop[]) => {
    if (!window.google || !startAddress) return;
    const svc = new window.google.maps.DirectionsService();
    setDirections(null);
    svc.route(
      {
        origin: startAddress,
        destination: startAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
        waypoints: currStops.map((s) => ({ location: s.address, stopover: true })),
      },
      (res: google.maps.DirectionsResult, status: string) => {
        if (status !== 'OK' || !res.routes || !res.routes[0]) {
          console.error('Route recalculation failed:', status, res);
          return;
        }
        const legs = res.routes[0].legs;
        const updated = applyTimes(currStops, legs);
        setTimedStops(updated);
        setDirections(res);
      }
    );
  }, [startAddress, applyTimes]);

  useEffect(() => {
    if (shouldRecalc && stops.length > 0) {
      recalcRoute(stops);
      setShouldRecalc(false);
    }
  }, [shouldRecalc, recalcRoute, stops]);

  useEffect(() => {
    if (stopsCountRef.current > 0) setShouldRecalc(true);
  }, [isOvernight, accomodation, eodTime]);

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
        setStops(ordered);
        recalcRoute(ordered);
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

  const tableContent = (
    <>
      <RunTable
        stops={stopsWithTimes}
        draggingId={dragging}
        remove={remove}
        onDragStart={onDragStart}
        onDrop={onDrop}
        onTimeChange={changeTime}
        hoveredIndex={hoveredIdx}
        selectedIndex={selectedIdx}
        onHover={onHoverRow}
        onSelect={(idx) => {
          onSelectRow(idx);
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setCurrentTab('map');
          }
        }}
      />
      {stats && (
        <div className="mt-2 text-sm">
          {`Total travel time: ${stats.travel} mins`}
          <br />
          {`Average travel per stop: ${stats.avg} mins`}
          <br />
          {`Total stops: ${stats.stops}`}
          <br />
          {`Number of days: ${stats.days}`}
        </div>
      )}
      <button
        onClick={generateRoute}
        className="w-full bg-blue-500 text-white py-2 rounded mt-4"
      >
        Generate Run
      </button>
      {stops.length > 0 && (
        <ShareModal url={shareUrl} onShare={generateShare} />
      )}
    </>
  );

  const runContent = (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-4 p-4 max-h-[50vh] overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col w-full">
            <label htmlFor="start-address" className="mb-1">Start Address</label>
            <AddressInput id="start-address" value={startAddress} onChange={updateStartAddress} placeholder="Start address" />
          </div>
            <div className="flex flex-col w-full sm:w-1/2 md:w-1/3">
              <label htmlFor="start-date" className="mb-1">Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-3 py-2 rounded dark:bg-gray-800 dark:text-white w-full"
              />
            </div>
            <div className="flex flex-col w-full sm:w-1/2 md:w-1/3">
              <label htmlFor="start-time" className="mb-1">Start Time</label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border px-3 py-2 rounded dark:bg-gray-800 dark:text-white w-full"
              />
            </div>
            <div className="flex flex-col w-full sm:w-1/2 md:w-1/3">
              <label htmlFor="end-time" className="mb-1">End Time</label>
              <input
                id="end-time"
                type="time"
                value={eodTime}
                onChange={(e) => setEodTime(e.target.value)}
                className="border px-3 py-2 rounded dark:bg-gray-800 dark:text-white w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="flex gap-2">
              <AddressInput id="add-address" value={address} onChange={setAddress} placeholder="Add address" />
              <button onClick={addAddressLine} className="px-4 py-2 rounded border text-sm bg-blue-500 text-white hover:bg-blue-600">Add</button>
            </div>
            <textarea value={bulkAddresses} onChange={(e) => updateBulkAddresses(e.target.value)} placeholder="One address per line" className="border px-3 py-2 rounded w-full h-40 dark:bg-gray-800 dark:text-white" />
          </div>
        </div>
      </div>
      <div className={`flex flex-col ${isDesktop ? 'flex-grow' : ''} overflow-y-auto p-4 ${!isDesktop ? 'max-h-[80vh] scroll-mt-24' : ''}`}>
        {tableContent}
      </div>
    </div>
  );

  const settingsContent = (
    <div className="p-4 flex flex-col gap-2">
      <label className="flex items-center">
        <input
          id="overnight"
          type="checkbox"
          checked={isOvernight}
          onChange={(e) => setIsOvernight(e.target.checked)}
          className="mr-2"
        />
        Overnight stop
      </label>
      {isOvernight && (
        <AddressInput id="accom" value={accomodation} onChange={setAccomodation} placeholder="Accomodation address" />
      )}
    </div>
  );

  const tabItems = useMemo(() => {
    const items: TabItem[] = [
      { key: 'run', title: 'Run', content: runContent },
      { key: 'settings', title: 'Settings', content: settingsContent },
    ];
    if (!isDesktop) {
      items.splice(1, 0, { key: 'map', title: 'Map', content: null });
    }
    return items;
  }, [runContent, settingsContent, isDesktop]);

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden min-h-screen">
      <AuthHeader />
      <div className="flex flex-col md:flex-row flex-grow md:overflow-hidden gap-4 md:gap-0">
        <div className="md:w-[40%] flex flex-col">
          <Tabs
            defaultKey="run"
            selectedKey={currentTab}
            onChange={(k) => setCurrentTab(k as string)}
            items={tabItems}
          />
        </div>
        {isMapVisible && (
          <div className={`${isDesktop ? 'md:w-[60%] h-screen' : 'h-[70vh]'} w-full overflow-hidden`}>
            <MapView
              start={startAddress}
              stops={timedStops}
              directions={directions}
              hoveredIndex={hoveredIdx}
              selectedIndex={selectedIdx}
              onSelect={onSelectRow}
              mapState={mapState}
              onMapStateChange={setMapState}
            />
          </div>
        )}
      </div>
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} />
    </div>
  );
}
