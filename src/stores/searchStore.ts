import { createStore } from 'solid-js/store';

interface SearchState {
  query: string;
  selectedTagIds: string[];
  yearFrom: number | null;
  yearTo: number | null;
}

export const [searchState, setSearchState] = createStore<SearchState>({
  query: '',
  selectedTagIds: [],
  yearFrom: null,
  yearTo: null,
});

export function setSearchQuery(query: string) {
  setSearchState('query', query);
}

export function setSelectedTagIds(ids: string[]) {
  setSearchState('selectedTagIds', ids);
}

export function toggleTagId(id: string) {
  const current = searchState.selectedTagIds;
  if (current.includes(id)) {
    setSearchState('selectedTagIds', current.filter((x) => x !== id));
  } else {
    setSearchState('selectedTagIds', [...current, id]);
  }
}

export function setYearFrom(year: number | null) {
  setSearchState('yearFrom', year);
}

export function setYearTo(year: number | null) {
  setSearchState('yearTo', year);
}

export function clearFilters() {
  setSearchState({ query: '', selectedTagIds: [], yearFrom: null, yearTo: null });
}
