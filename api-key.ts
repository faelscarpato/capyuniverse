// api-key.ts
const KEY_STORAGE = "capyUniverseApiKey_gemini";

export function getStoredApiKey(): string | null {
  try {
    const k = localStorage.getItem(KEY_STORAGE);
    return k && k.trim().length > 0 ? k.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } catch {
    // ignore
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(KEY_STORAGE);
  } catch {
    // ignore
  }
}

export function hasStoredApiKey(): boolean {
  return !!getStoredApiKey();
}
