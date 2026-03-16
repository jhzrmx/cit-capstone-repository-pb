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

export const setSearchQuery = (query: string) => {
  setSearchState('query', query);
};

export const setSelectedTagIds = (ids: string[]) => {
  setSearchState('selectedTagIds', ids);
};

export const toggleTagId = (id: string) => {
  const current = searchState.selectedTagIds;
  if (current.includes(id)) {
    setSearchState('selectedTagIds', current.filter((x) => x !== id));
  } else {
    setSearchState('selectedTagIds', [...current, id]);
  }
};

export const setYearFrom = (year: number | null) => {
  setSearchState('yearFrom', year);
};

export const setYearTo = (year: number | null) => {
  setSearchState('yearTo', year);
};

export const clearFilters = () => {
  setSearchState({ query: '', selectedTagIds: [], yearFrom: null, yearTo: null });
};