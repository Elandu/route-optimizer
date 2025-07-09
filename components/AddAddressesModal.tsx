'use client';
import { useEffect } from 'react';
import AddressInput from './AddressInput';

type Props = {
  open: boolean;
  onClose: () => void;
  address: string;
  onAddressChange: (v: string) => void;
  addAddressLine: () => void;
  bulk: string;
  onBulkChange: (v: string) => void;
};

export default function AddAddressesModal({
  open,
  onClose,
  address,
  onAddressChange,
  addAddressLine,
  bulk,
  onBulkChange,
}: Props) {
  

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', esc);
    const el = document.getElementById('modal-add-address');
    el?.focus();
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 p-6 rounded-lg w-11/12 max-w-md space-y-4">
        <div className="flex gap-2">
          <AddressInput
            value={address}
            onChange={onAddressChange}
            placeholder="Add address"
            ariaLabel="Add address"
            id="modal-add-address"
          />
          <button
            onClick={addAddressLine}
            className="px-4 py-2 rounded border text-sm bg-blue-500 text-white hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <textarea
          value={bulk}
          onChange={(e) => onBulkChange(e.target.value)}
          placeholder="One address per line"
          className="border px-3 py-2 rounded w-full h-40 box-border appearance-none dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded border text-sm bg-blue-500 text-white hover:bg-blue-600"
        >
          Done
        </button>
      </div>
    </div>
  );
}
