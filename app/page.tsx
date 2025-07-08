'use client';
import { useState } from 'react';
import AddressInput from '../components/AddressInput';
import RunTable from '../components/RunTable';
import ShareModal from '../components/ShareModal';
import AuthHeader from '../components/AuthHeader';
import { encrypt } from '../lib/encryption';
import Script from 'next/script';

interface Stop { id: string; address: string; job?: string; }

declare global {
  interface Window {
    grecaptcha?: any;
    google?: any;
  }
}

export default function Page() {
  const [address, setAddress] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [shareUrl, setShareUrl] = useState('');

  const addStop = () => {
    if (!address) return;
    setStops([...stops, { id: Date.now().toString(), address }]);
    setAddress('');
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
        <div className="flex gap-2">
          <AddressInput value={address} onChange={setAddress} placeholder="Add address" />
          <button onClick={addStop} className="px-4 py-2 border rounded">Add</button>
        </div>
        <RunTable stops={stops} remove={remove} />
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
