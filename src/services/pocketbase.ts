import PocketBase from 'pocketbase';
import type { User } from '../types';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL ?? 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);

// Typed auth store helper
export const getAuthUser = (): User | null => {
  const raw = pb.authStore.record;
  if (!raw) return null;
  return raw as unknown as User;
};

export const isAuthenticated = (): boolean => {
  return pb.authStore.isValid;
};