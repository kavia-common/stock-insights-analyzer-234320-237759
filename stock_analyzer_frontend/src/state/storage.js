// PUBLIC_INTERFACE
export function loadSessionJSON(key, fallback) {
  /** Loads JSON from sessionStorage with safe fallback. */
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// PUBLIC_INTERFACE
export function saveSessionJSON(key, value) {
  /** Saves JSON to sessionStorage. */
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
