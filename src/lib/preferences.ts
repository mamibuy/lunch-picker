import { Category } from './shops';

const KEY     = 'lunch-picker:preferred-categories';
const ANY_KEY = 'lunch-picker:prefer-any';
const MAX = 3;

export function loadPreferences(): Category[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePreferences(cats: Category[]): void {
  localStorage.setItem(KEY, JSON.stringify(cats.slice(0, MAX)));
}

export function loadPreferAny(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ANY_KEY) === 'true';
}

export function savePreferAny(val: boolean): void {
  localStorage.setItem(ANY_KEY, String(val));
}

export const MAX_PREFERENCES = MAX;
