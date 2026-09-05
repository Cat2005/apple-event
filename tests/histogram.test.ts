import { describe, expect, it } from "vitest";
import { buildHistogram, niceStep } from "../components/presenter/bucketing";

describe("bucket widths", () => {
  it("picks widths people read without thinking", () => {
    expect([0.3, 1, 1.5, 3, 7, 12, 90, 190].map(niceStep)).toEqual([
      0.5, 1, 2, 5, 10, 20, 100, 200,
    ]);
  });
});

describe("building the histogram", () => {
  it("returns nothing when nobody has guessed", () => {
    expect(buildHistogram([])).toBeNull();
  });

  it("counts every guess exactly once", () => {
    const guesses = [3, 7, 7, 12, 19, 22, 4, 8, 15, 15, 15, 30];
    const h = buildHistogram(guesses)!;
    expect(h.buckets.reduce((n, b) => n + b.count, 0)).toBe(guesses.length);
  });

  it("keeps whole-number questions on whole-number buckets", () => {
    const h = buildHistogram([0, 1, 2, 3, 4, 5, 6, 30])!;
    for (const b of h.buckets) expect(Number.isInteger(b.end - b.start)).toBe(true);
  });

  it("gives a bar per number when the range is small, so each bar names itself", () => {
    const h = buildHistogram([4, 5, 5, 10, 12])!;
    expect(h.buckets[0].end - h.buckets[0].start).toBe(1);
    expect(h.buckets.find((b) => b.start === 5)!.count).toBe(2);
    expect(h.buckets.find((b) => b.start === 10)!.count).toBe(1);
    expect(h.buckets.find((b) => b.start === 12)!.count).toBe(1);
  });

  it("keeps the bars wide enough to hold a number", () => {
    for (const guesses of [[0, 30], [5, 5, 8, 10, 20], [699, 2599], [1, 100]]) {
      const h = buildHistogram(guesses)!;
      expect(h.buckets.length, `for ${guesses}`).toBeLessThanOrEqual(13);
    }
  });

  it("spreads prices across readable buckets", () => {
    const h = buildHistogram([699, 899, 999, 1099, 1199, 1299, 1499, 1999, 2599])!;
    expect(h.buckets.length).toBeGreaterThanOrEqual(6);
    expect(h.buckets.length).toBeLessThanOrEqual(16);
    expect(h.buckets[0].end - h.buckets[0].start).toBe(200);
  });

  it("survives everyone guessing the same thing", () => {
    const h = buildHistogram([12, 12, 12, 12])!;
    expect(h.buckets.reduce((n, b) => n + b.count, 0)).toBe(4);
    expect(h.tallest).toBe(4);
  });

  it("widens the range to include the real answer", () => {
    const h = buildHistogram([5, 6, 7], 40)!;
    expect(h.start).toBeLessThanOrEqual(5);
    expect(h.end).toBeGreaterThanOrEqual(40);
  });

  it("never drops a guess at the very top of the range", () => {
    for (const max of [10, 33, 100, 257, 1999]) {
      const guesses = [0, Math.floor(max / 2), max];
      const h = buildHistogram(guesses)!;
      expect(h.buckets.reduce((n, b) => n + b.count, 0), `max ${max}`).toBe(3);
    }
  });

  it("handles a single guess", () => {
    const h = buildHistogram([1199])!;
    expect(h.buckets.reduce((n, b) => n + b.count, 0)).toBe(1);
  });
});
