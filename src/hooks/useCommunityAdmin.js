import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { communityAction } from '../services/communityService';

export default function useCommunityAdmin() {
  const [admin, setAdmin] = useState(false), [revision, setRevision] = useState(0);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setAdmin(false); setRevision(n => n + 1);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const allowed = user ? (await communityAction('status')).admin === true : false;
      if (active) setAdmin(allowed);
    }).catch(() => { if (active) setAdmin(false); });
    return () => { active = false; };
  }, [revision]);
  return admin;
}
