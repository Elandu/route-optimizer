'use client';
import { useState } from 'react';

export interface TabItem {
  key: string;
  title: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  selectedKey?: string;
  onChange?: (key: string) => void;
}
export default function Tabs({ items, defaultKey, selectedKey, onChange }: TabsProps) {
  const [internalKey, setInternalKey] = useState(defaultKey ?? items[0]?.key);
  const activeKey = selectedKey ?? internalKey;

  const change = (key: string) => {
    setInternalKey(key);
    onChange?.(key);
  };

  return (
    <div className="w-full h-full flex flex-col" role="tablist">
      <div className="flex border-b mb-4">
        {items.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={activeKey === item.key}
            onClick={() => change(item.key)}
            className={`px-4 py-2 focus:outline-none border-b-2 ${
              activeKey === item.key ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
      {items.map((item) =>
        activeKey === item.key ? (
          <div key={item.key} role="tabpanel" className="mt-4 flex-1 flex">
            {item.content}
          </div>
        ) : null
      )}
    </div>
  );
}
