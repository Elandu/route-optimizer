'use client';
import UserGreeting from './UserGreeting';
import ThemeToggle from './ThemeToggle';

export default function AuthHeader() {
  return (
    <header className="flex justify-between items-center p-4 border-b">
      <UserGreeting />
      <ThemeToggle />
    </header>
  );
}
