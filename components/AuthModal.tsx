'use client';
import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Button } from '@heroui/react';
import TextInput from './TextInput';
import { useUser } from '@/UserContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: Props) {
  const { setUser } = useUser();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setUser({ ...data, status: 'Free' });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setUser({ ...data, status: 'Free' });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded shadow w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 p-6">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold">Account</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="space-y-4">
          <Tab.Group selectedIndex={tab} onChange={setTab}>
            <Tab.List className="flex space-x-2 border-b">
              <Tab className={({ selected }) =>
                `px-3 py-2 text-sm focus:outline-none ${selected ? 'border-b-2 border-blue-500' : 'border-b-2 border-transparent'}`}>Login</Tab>
              <Tab className={({ selected }) =>
                `px-3 py-2 text-sm focus:outline-none ${selected ? 'border-b-2 border-blue-500' : 'border-b-2 border-transparent'}`}>Register</Tab>
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <form onSubmit={handleLogin} className="space-y-4">
                  <TextInput id="login-email" label="Email" value={loginEmail} onChange={setLoginEmail} type="email" autoComplete="email" />
                  <TextInput id="login-password" label="Password" value={loginPassword} onChange={setLoginPassword} type="password" autoComplete="current-password" />
                  <Button type="submit" color="primary" fullWidth isDisabled={loading}>Login</Button>
                </form>
              </Tab.Panel>
              <Tab.Panel>
                <form onSubmit={handleRegister} className="space-y-4">
                  <TextInput id="reg-name" label="Full Name" value={regName} onChange={setRegName} autoComplete="name" />
                  <TextInput id="reg-email" label="Email" value={regEmail} onChange={setRegEmail} type="email" autoComplete="email" />
                  <TextInput id="reg-password" label="Password" value={regPassword} onChange={setRegPassword} type="password" autoComplete="new-password" />
                  <Button type="submit" color="primary" fullWidth isDisabled={loading}>Register</Button>
                </form>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
        <Button color="primary" variant="light" onPress={onClose} fullWidth>
          Close
        </Button>
      </div>
    </div>
  );
}
