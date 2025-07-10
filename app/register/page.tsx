'use client';
import { useState } from 'react';
import TextInput from '@/components/TextInput';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      setSubmitting(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 1000);
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10">
      {success ? (
        <div className="text-center text-green-600">Registration successful!</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 w-80">
          <h1 className="text-xl font-semibold mb-2">Register</h1>
          <TextInput
            id="name"
            label="Full Name"
            value={name}
            onChange={setName}
            autoComplete="name"
          />
          <TextInput
            id="email"
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            autoComplete="email"
          />
          <TextInput
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete="new-password"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" color="primary" isDisabled={submitting} fullWidth>
            Register
          </Button>
        </form>
      )}
    </div>
  );
}
