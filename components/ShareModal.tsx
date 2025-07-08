'use client';
import { DialogTrigger, Dialog } from 'react-aria-components';

interface Props {
  url: string;
}

export default function ShareModal({ url }: Props) {
  return (
    <DialogTrigger>
      <button>Share</button>
      <Dialog className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-4 rounded shadow max-w-sm w-full">
          <button className="float-right" slot="close">
            X
          </button>
          <p className="mb-2">Share this link:</p>
          <input value={url} readOnly className="w-full border p-2" />
        </div>
      </Dialog>
    </DialogTrigger>
  );
}
