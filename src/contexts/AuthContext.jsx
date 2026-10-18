import { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { clearActiveDraft } from '../services/jsaDraftService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let previousUser;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      previousUser = session?.user?.id ?? null;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user?.id ?? null;
      if (previousUser !== undefined && previousUser !== next) clearActiveDraft({ preserveGuest: true });
      previousUser = next;
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
