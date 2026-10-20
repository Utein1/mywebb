/**
 * Produces a balanced 12-column bento layout for any number of project cards.
 */
export function projectSpans(count: number): string[] {
  const spans: string[] = [];
  let index = 0;
  while (index < count) {
    const remaining = count - index;
    if (remaining >= 4) {
      spans.push("span-7", "span-5", "span-5", "span-7");
      index += 4;
    } else if (remaining === 3) {
      spans.push("span-7", "span-5", "span-12");
      index += 3;
    } else if (remaining === 2) {
      spans.push("span-6", "span-6");
      index += 2;
    } else {
      spans.push("span-12");
      index += 1;
    }
  }
  return spans;
}
