'use client';
import { useState } from 'react';

interface Props {
  url: string;
  onShare?: () => void;
}

export default function ShareModal({ url, onShare }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          onShare?.();
          setOpen(true);
        }}
        className="px-4 py-2 rounded border text-sm bg-blue-500 text-white hover:bg-blue-600"
      >
        Share
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow max-w-sm w-full">
            <button
              className="float-right text-red-600 hover:text-red-800"
              onClick={() => setOpen(false)}
            >
              X
            </button>
            <p className="mb-2">Share this link:</p>
            <input
              value={url}
              readOnly
              className="w-full border px-3 py-2 rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}
    </>
  );
}
