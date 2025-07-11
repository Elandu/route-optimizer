'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  name: string;
  email: string;
  status?: string;
}

interface UserContextValue {
  /**
   * `undefined` indicates the auth state has not yet been
   * loaded from storage. `null` means no logged in user.
   */
  user: User | null | undefined;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  // `undefined` until localStorage has been read
  const [user, setUserState] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUserState(JSON.parse(stored));
      } else {
        setUserState(null);
      }
    } catch {
      setUserState(null);
    }
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    try {
      if (u) {
        localStorage.setItem('user', JSON.stringify(u));
      } else {
        localStorage.removeItem('user');
      }
    } catch {}
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
