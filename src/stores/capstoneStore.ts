import { createStore } from 'solid-js/store';
import type { Capstone } from '../types';

interface CapstoneState {
  items: Capstone[];
  total: number;
  loading: boolean;
}

export const [capstoneState, setCapstoneState] = createStore<CapstoneState>({
  items: [],
  total: 0,
  loading: false,
});

export function setCapstones(items: Capstone[], total: number) {
  setCapstoneState({ items, total });
}

export function setCapstoneLoading(loading: boolean) {
  setCapstoneState('loading', loading);
}
