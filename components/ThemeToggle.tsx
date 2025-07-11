'use client';
import { Button } from '@heroui/react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      isIconOnly
      variant="light"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onPress={toggleTheme}
      className="text-gray-600 dark:text-gray-300"
    >
      {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </Button>
  );
}
