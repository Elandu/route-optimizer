'use client';
import { useState } from 'react';

interface Props {
  url: string;
}

export default function ShareModal({ url }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Share</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow max-w-sm w-full">
            <button className="float-right" onClick={() => setOpen(false)}>
              X
            </button>
            <p className="mb-2">Share this link:</p>
            <input value={url} readOnly className="w-full border p-2" />
          </div>
        </div>
      )}
    </>
  );
}
