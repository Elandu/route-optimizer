'use client';
import { useState } from 'react';
import AddressInput from '../components/AddressInput';
import RunTable from '../components/RunTable';
import ShareModal from '../components/ShareModal';
import AuthHeader from '../components/AuthHeader';
import MapView from '../components/MapView';
import { encrypt } from '../lib/encryption';
import Script from 'next/script';

interface Stop { id: string; address: string; time: number; job?: string; }

declare global {
  interface Window {
    grecaptcha?: any;
    google?: any;
  }
}

export default function Page() {
  const [startAddress, setStartAddress] = useState('');
  const [address, setAddress] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [time, setTime] = useState(60);
  const [shareUrl, setShareUrl] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);

  const addStop = () => {
    if (!address) return;
    setStops([...stops, { id: Date.now().toString(), address, time }]);
    setAddress('');
    setTime(60);
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

  const remove = (id: string) => setStops(stops.filter(s => s.id !== id));

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
          <button
            onClick={async () => setStartAddress(await navigator.clipboard.readText())}
            className="px-4 py-2 border rounded"
          >
            Paste
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <AddressInput value={address} onChange={setAddress} placeholder="Add address" />
          <input
            type="number"
            value={time}
            onChange={(e) => setTime(parseInt(e.target.value) || 0)}
            className="border px-2 py-1 rounded w-24"
          />
          <button onClick={addStop} className="px-4 py-2 border rounded">Add</button>
        </div>
        <MapView start={startAddress} stops={stops} />
        <RunTable stops={stops} remove={remove} onDragStart={onDragStart} onDrop={onDrop} />
        {stops.length > 0 && (
          <div className="mt-4 flex gap-2">
            <button onClick={generateShare} className="px-4 py-2 border rounded">Generate Share Link</button>
            <ShareModal url={shareUrl} />
          </div>
        )}
      </main>
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} />
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} />
    </div>
  );
}
