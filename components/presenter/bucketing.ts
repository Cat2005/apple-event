/** Bucketing for number questions. Pure, so the shape can be reasoned about on its own. */

export type Bucket = { start: number; end: number; count: number };

export type Histogram = {
  buckets: Bucket[];
  start: number;
  end: number;
  tallest: number;
};

/** 1, 2, 5, 10, 20, 50, 100 … — the widths people read without thinking. */
export function niceStep(raw: number) {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

export function buildHistogram(numbers: number[], answer?: number): Histogram | null {
  if (numbers.length === 0) return null;

  const points = answer === undefined ? numbers : [...numbers, answer];
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const allIntegers = points.every(Number.isInteger);

  // Each bar carries its own number inside it, so bars must stay wide enough to
  // hold one: aim for at most ~13 columns.
  const span = hi - lo;
  let width: number;
  if (span === 0) width = 1;
  else if (allIntegers && span <= 12) width = 1;
  else width = niceStep(span / 10);
  if (allIntegers) width = Math.max(1, Math.round(width));

  const start = Math.floor(lo / width) * width;
  const end = Math.max(start + width, Math.ceil((hi + width / 1000) / width) * width);
  const count = Math.max(1, Math.round((end - start) / width));

  const buckets: Bucket[] = Array.from({ length: count }, (_, i) => ({
    start: start + i * width,
    end: start + (i + 1) * width,
    count: 0,
  }));

  for (const value of numbers) {
    const index = Math.min(count - 1, Math.max(0, Math.floor((value - start) / width)));
    buckets[index].count++;
  }

  return { buckets, start, end, tallest: Math.max(...buckets.map((b) => b.count)) };
}

/** Smallest distance from the answer among the guesses. */
export function closestDistance(numbers: number[], answer: number) {
  return Math.min(...numbers.map((n) => Math.abs(n - answer)));
}
