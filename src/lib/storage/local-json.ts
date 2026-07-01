/** อ่าน/เขียน JSON ใน localStorage พร้อม fallback หน่วยความจำเมื่อ SSR หรือ storage ล้มเหลว */
export function readLocalJson<T>(key: string, fallback: T, memory: { current: T }): T {
  if (typeof window === "undefined") return structuredClone(fallback);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(memory.current);
    const parsed = JSON.parse(raw) as T;
    memory.current = parsed;
    return structuredClone(parsed);
  } catch {
    return structuredClone(memory.current);
  }
}

export function writeLocalJson<T>(key: string, value: T, memory: { current: T }): void {
  memory.current = value;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode
  }
}
