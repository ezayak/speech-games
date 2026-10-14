// Up after 4 of the last 5 right first time, down after 2 misses in a row.
export class Level {
  private recent: boolean[] = [];
  private misses = 0;

  constructor(private readonly key: string, public value: number, private readonly max = 3) {}

  record(correct: boolean): number {
    this.recent = [...this.recent, correct].slice(-5);
    this.misses = correct ? 0 : this.misses + 1;
    if (this.recent.length === 5 && this.recent.filter(Boolean).length >= 4 && this.value < this.max) {
      this.value++;
      this.recent = [];
    } else if (this.misses >= 2 && this.value > 1) {
      this.value--;
      this.recent = [];
      this.misses = 0;
    }
    try { localStorage.setItem(this.key, String(this.value)); } catch { /* ignore */ }
    return this.value;
  }
}

export function levelFor(game: string, lang: string): Level {
  const key = `level:${game}:${lang}`;
  let v = 1;
  try { v = Number(localStorage.getItem(key)) || 1; } catch { /* ignore */ }
  return new Level(key, v);
}
