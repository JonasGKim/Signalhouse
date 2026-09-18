import { compareDocuments } from '../lib/filings/compare';
self.onmessage = (event: MessageEvent<{ earlier: string; later: string }>) => {
  try {
    self.postMessage({
      changes: compareDocuments(event.data.earlier, event.data.later),
    });
  } catch (e) {
    self.postMessage({
      error:
        e instanceof Error
          ? e.message
          : 'Comparison failed. Try a smaller section.',
    });
  }
};
