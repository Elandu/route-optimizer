'use client';
import { useEffect, useState } from 'react';
import { Tabs as HeroTabs, Tab } from '@heroui/react';

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
  const initial = () => {
    if (selectedKey) return selectedKey;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) ?? defaultKey ?? items[0]?.key;
    }
    return defaultKey ?? items[0]?.key;
  };

  const [activeKey, setActiveKey] = useState<string | undefined>(initial);

  useEffect(() => {
    if (selectedKey) setActiveKey(selectedKey);
  }, [selectedKey]);

  const change = (key: React.Key) => {
    const val = String(key);
    setActiveKey(val);
    try {
      localStorage.setItem(storageKey, val);
    } catch {}
    onChange?.(val);
  };

  return (
    <HeroTabs
      selectedKey={activeKey}
      onSelectionChange={change}
      className="flex flex-col flex-1 overflow-hidden"
    >
      {items.map((item) => (
        <Tab key={item.key} title={item.title}>
          <div className="pt-4 flex flex-col flex-1 overflow-y-auto">{item.content}</div>
        </Tab>
      ))}
    </HeroTabs>
  );
}
