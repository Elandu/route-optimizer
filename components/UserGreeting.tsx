'use client';
import { useState } from 'react';
import AuthModal from './AuthModal';
import { useUser } from '@/UserContext';

export default function UserGreeting() {
  const { user, setUser } = useUser();
  const [open, setOpen] = useState(false);

  const logout = () => {
    setUser(null);
  };

  return (
    <div className="flex items-center space-x-2">
      {user ? (
        <>
          <a href="/user" className="text-sm text-blue-600 hover:underline">
            Hi {user.name}!
          </a>
          <button
            onClick={logout}
            className="text-sm text-blue-600 hover:underline"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          Login / Register
        </button>
      )}
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
