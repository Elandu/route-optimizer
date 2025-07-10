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
          <span className="text-sm">Hi {user.name}!</span>
          <button onClick={logout} className="text-sm text-blue-600">
            Logout
          </button>
        </>
      ) : (
        <button onClick={() => setOpen(true)} className="text-sm text-blue-600">
          Login / Register
        </button>
      )}
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
