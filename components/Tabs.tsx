'use client';
import { Tab } from '@headlessui/react';
import { useEffect, useState } from 'react';

export interface TabItem {
  key: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  selectedKey?: string;
  onChange?: (key: string) => void;
  storageKey?: string;
}

export default function Tabs({
  items,
  defaultKey,
  selectedKey,
  onChange,
  storageKey = 'currentTab',
}: TabsProps) {
  const initKey = () => {
    if (selectedKey) return selectedKey;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) ?? defaultKey ?? items[0]?.key;
    }
    return defaultKey ?? items[0]?.key;
  };

  const [activeKey, setActiveKey] = useState(initKey);

  useEffect(() => {
    if (selectedKey) setActiveKey(selectedKey);
  }, [selectedKey]);

  const index = items.findIndex((i) => i.key === activeKey);

  const change = (idx: number) => {
    const val = items[idx]?.key;
    if (!val) return;
    setActiveKey(val);
    try {
      localStorage.setItem(storageKey, val);
    } catch {}
    onChange?.(val);
  };

  return (
    <Tab.Group
      selectedIndex={index}
      onChange={change}
      as="div"
      className="flex flex-col flex-1 overflow-hidden min-h-0"
    >
      <Tab.List className="flex border-b px-4 py-2 space-x-2 sm:space-x-4">
        {items.map((item) => (
          <Tab
            key={item.key}
            className={({ selected }) =>
              `px-3 py-2 text-sm focus:outline-none ${selected ? 'border-b-2 border-blue-500' : 'border-b-2 border-transparent'}`
            }
          >
            {item.title}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="flex-1 overflow-y-auto scroll-touch min-h-0">
        {items.map((item) => (
          <Tab.Panel key={item.key} className="p-4 h-full">
            {item.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
