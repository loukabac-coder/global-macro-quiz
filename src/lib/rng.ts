// Générateur pseudo-aléatoire avec graine : permet que tout le monde ait les mêmes questions le même jour.

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(input: T[], rng: () => number): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Date du jour à Paris, au format AAAA-MM-JJ (à appeler dans un effet ou un gestionnaire, pas pendant le rendu).
const parisDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" });

export function todayParis(now = Date.now()): string {
  return parisDay.format(now);
}
