export function formatResearchDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
