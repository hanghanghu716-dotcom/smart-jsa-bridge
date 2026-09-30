import { supabase } from '../supabaseClient';
export const isStorageLimitError = error => String(error?.message || '').includes('FREE_PROJECT_LIMIT');
export function storageChanged() {
 if (typeof window !== 'undefined') window.dispatchEvent(new Event('jsa-storage-changed'));
}
export async function getStorageUsage(client = supabase) {
 const { data: { user }, error: authError }=await client.auth.getUser();
 if (!user) { if (authError && authError.name !== 'AuthSessionMissingError') throw authError; return null; }
 const { data,error }=await client.rpc('get_jsa_storage_usage');
 if(error)throw error;
 if(!data || !Number.isInteger(data.used) || typeof data.can_create!=='boolean')throw Error('STORAGE_USAGE_UNAVAILABLE');
 return data;
}
