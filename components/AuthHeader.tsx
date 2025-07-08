'use client';
import { useEffect, useState } from 'react';

enum Theme {
  Light = 'light',
  Dark = 'dark'
}

export default function AuthHeader() {
  const [name] = useState('Demo User');
  const [theme, setTheme] = useState<Theme>(Theme.Light);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (saved) setTheme(saved as Theme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === Theme.Dark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <div>{name}</div>
      <button onClick={() => setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light)}>
        {theme === Theme.Dark ? 'Light' : 'Dark'} mode
      </button>
    </header>
  );
}
