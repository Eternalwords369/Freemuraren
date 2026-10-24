/**
 * Lagringsadapter. Version ett använder LocalStorage i webbläsaren.
 *
 * LocalStorage är okrypterad klientlagring: allt som sparas kan läsas av den
 * som har tillgång till webbläsarprofilen. En framtida synkronisering (t.ex.
 * Supabase) kan implementera samma gränssnitt för den lokala cachen och
 * hantera fjärrsynk separat, utan att komponenterna behöver ändras.
 */
export interface StorageAdapter {
  readonly name: string;
  /** Returnerar sparad text eller null om inget finns. Kastar vid läsfel. */
  read(): string | null;
  /** Kastar vid skrivfel, t.ex. när lagringsutrymmet är fullt. */
  write(value: string): void;
  clear(): void;
}

export const STORAGE_KEY = "living-cosmos-codex:db";
export const BACKUP_KEY = "living-cosmos-codex:db-backup";

export class LocalStorageAdapter implements StorageAdapter {
  readonly name = "LocalStorage";
  constructor(private readonly key: string = STORAGE_KEY) {}

  read(): string | null {
    return window.localStorage.getItem(this.key);
  }

  write(value: string): void {
    window.localStorage.setItem(this.key, value);
  }

  clear(): void {
    window.localStorage.removeItem(this.key);
  }

  /** Sparar en kopia av oläsbar data innan den ersätts, så att inget försvinner tyst. */
  backupRaw(value: string): void {
    try {
      window.localStorage.setItem(BACKUP_KEY, value);
    } catch {
      // Om även säkerhetskopian misslyckas finns inget mer att göra här.
    }
  }
}

/** Minnesadapter för tester och miljöer utan LocalStorage. */
export class MemoryAdapter implements StorageAdapter {
  readonly name = "Minne";
  private value: string | null = null;
  read() {
    return this.value;
  }
  write(value: string) {
    this.value = value;
  }
  clear() {
    this.value = null;
  }
}

export function estimateBytes(value: string): number {
  // LocalStorage lagrar UTF-16, dvs. två byte per kodenhet.
  return value.length * 2;
}
