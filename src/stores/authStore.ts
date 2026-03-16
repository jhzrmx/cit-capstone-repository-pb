import { createStore } from 'solid-js/store';
import { pb } from '../services/pocketbase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  /** When true, stay on public routes until OAuth user picks department (blocks PublicOnlyRoute redirect). */
  pendingOAuthDepartment: boolean;
}

export const [auth, setAuth] = createStore<AuthState>({
  user: pb.authStore.record ? (pb.authStore.record as unknown as User) : null,
  loading: false,
  pendingOAuthDepartment: false,
});

pb.authStore.onChange(() => {
  setAuth('user', pb.authStore.record ? (pb.authStore.record as unknown as User) : null);
});

export const setAuthUser = (user: User | null) => {
  setAuth('user', user);
};

export const setAuthLoading = (loading: boolean) => {
  setAuth('loading', loading);
};

export const setPendingOAuthDepartment = (pending: boolean) => {
  setAuth('pendingOAuthDepartment', pending);
};