'use client';
import {useRef} from 'react';
import {useTabList, useTab, useTabPanel, useTabs} from '@react-aria/tabs';
import {useTabListState, TabListState} from '@react-stately/tabs';
import type {Key} from '@react-types/shared';
import React from 'react';

export interface TabItem {
  key: string;
  title: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
}

export default function Tabs({items, defaultKey}: TabsProps) {
  const state = useTabListState<TabItem>({
    items,
    defaultSelectedKey: defaultKey ?? 'run',
  });

  const tabsRef = useRef<HTMLDivElement>(null);
  const { tabsProps } = useTabs({}, state, tabsRef);
  const listRef = useRef<HTMLDivElement>(null);
  const {tabListProps} = useTabList({ onSelectionChange: (k) => state.setSelectedKey(k) }, state, listRef);

  return (
    <div {...tabsProps} ref={tabsRef}>
      <div {...tabListProps} ref={listRef} className="flex border-b mb-4">
        {items.map(item => (
          <Tab key={item.key} itemKey={item.key} state={state}>
            {item.title}
          </Tab>
        ))}
      </div>
      {items.map(item => (
        <TabPanel key={item.key} itemKey={item.key} state={state}>
          {item.content}
        </TabPanel>
      ))}
    </div>
  );
}

interface TabProps {
  itemKey: string;
  state: TabListState<TabItem>;
  children: React.ReactNode;
}

function Tab({ itemKey, state, children }: TabProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { tabProps } = useTab({ key: itemKey as Key }, state, ref);
  return (
    <button
      {...tabProps}
      ref={ref}
      className="px-4 py-2 text-gray-500 border-b-2 border-transparent aria-selected:border-b-2 aria-selected:border-blue-500 aria-selected:font-semibold"
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  itemKey: string;
  state: TabListState<TabItem>;
  children: React.ReactNode;
}

function TabPanel({ itemKey, state, children }: TabPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { tabPanelProps } = useTabPanel({}, state, ref);
  if (state.selectedKey !== itemKey) return null;
  return (
    <div {...tabPanelProps} ref={ref} className="mt-4">
      {children}
    </div>
  );
}
