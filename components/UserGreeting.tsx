'use client';
import { useState } from 'react';
import AuthModal from './AuthModal';
import { useUser } from '@/UserContext';
import { Button } from '@heroui/react';

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
          <Button onPress={logout} variant="light" color="primary" className="text-sm">
            Logout
          </Button>
        </>
      ) : (
        <Button
          onPress={() => setOpen(true)}
          variant="light"
          color="primary"
          className="text-sm"
        >
          Login / Register
        </Button>
      )}
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
