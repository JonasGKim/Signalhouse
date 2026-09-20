import { diffLines } from 'diff';
export const MAX_DOCUMENT_LENGTH = 500_000;
export function normalizeDocument(text: string) {
  return (
    text
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[\t ]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n') + '\n'
  );
}
export function compareDocuments(earlier: string, later: string) {
  if (!earlier.trim() || !later.trim())
    throw new Error('Add text to both filings before comparing.');
  if (
    earlier.length > MAX_DOCUMENT_LENGTH ||
    later.length > MAX_DOCUMENT_LENGTH
  )
    throw new Error('Compare sections of up to 500,000 characters per filing.');
  const changes = diffLines(
    normalizeDocument(earlier),
    normalizeDocument(later),
    { timeout: 1500, maxEditLength: 10000 },
  );
  if (!changes)
    throw new Error(
      'These documents differ too much for one comparison. Try comparing the same section from each filing.',
    );
  return changes.map((part) => ({
    kind: part.added
      ? ('added' as const)
      : part.removed
        ? ('removed' as const)
        : ('unchanged' as const),
    text: part.value,
    lines: part.count,
  }));
}
