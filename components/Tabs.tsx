'use client';
import React, {ReactNode, useContext, useRef} from 'react';
import {Item} from '@react-stately/collections';
import {useTabListState, TabListState} from '@react-stately/tabs';
import {useTab, useTabList, useTabPanel} from 'react-aria';

const TabsContext = React.createContext<TabListState<unknown> | null>(null);

export function TabList({children, className}: {children: ReactNode; className?: string}) {
  const tabs = React.Children.toArray(children) as React.ReactElement<any>[];
  const items = tabs.map((tab, i) => <Item key={tab.key ?? i}>{(tab.props as any).children}</Item>);
  const state = useTabListState({children: items});
  const ref = useRef<HTMLDivElement>(null);
  const {tabListProps} = useTabList({orientation: 'horizontal'}, state, ref);

  return (
    <TabsContext.Provider value={state}>
      <div {...tabListProps} ref={ref} className={`flex gap-4 ${className || ''}`}> 
        {tabs.map(tab => React.cloneElement(tab, {itemKey: tab.key} as any))}
      </div>
    </TabsContext.Provider>
  );
}

export function Tab({itemKey, children}: {itemKey?: React.Key; children: ReactNode}) {
  const state = useContext(TabsContext)!;
  const ref = useRef<HTMLButtonElement>(null);
  const {tabProps} = useTab({key: itemKey as any}, state, ref);

  return (
    <button
      {...tabProps}
      ref={ref}
      className="px-4 py-2 focus:outline-none aria-selected:border-b-2 aria-selected:font-bold"
    >
      {children}
    </button>
  );
}

export function TabPanel({itemKey, children, className}: {itemKey?: React.Key; children: ReactNode; className?: string}) {
  const state = useContext(TabsContext)!;
  const ref = useRef<HTMLDivElement>(null);
  const {tabPanelProps} = useTabPanel({id: String(itemKey)}, state, ref);
  if (state.selectedKey !== itemKey) {
    return null;
  }
  return (
    <div {...tabPanelProps} ref={ref} className={className}>
      {children}
    </div>
  );
}
