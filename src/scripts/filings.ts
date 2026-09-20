export function initializeFilings() {
  const form = document.querySelector<HTMLFormElement>('#filing-form');
  if (!form) return;
  const earlier = document.querySelector<HTMLTextAreaElement>('#earlier-text')!,
    later = document.querySelector<HTMLTextAreaElement>('#later-text')!;
  const message = document.querySelector<HTMLElement>('#filing-message')!,
    results = document.querySelector<HTMLElement>('#filing-results')!;
  const diff = document.querySelector<HTMLElement>('#filing-diff')!,
    button = document.querySelector<HTMLButtonElement>('#compare-filings')!;
  const toggle = document.querySelector<HTMLInputElement>('#changes-only')!;
  let worker: Worker | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  function stop() {
    worker?.terminate();
    worker = undefined;
    clearTimeout(timeout);
    button.disabled = false;
    button.textContent = 'Compare filings';
    form!.removeAttribute('aria-busy');
  }
  function invalidate() {
    stop();
    results.hidden = true;
    diff.replaceChildren();
    message.textContent =
      'Documents changed. Compare again to update the results.';
  }
  form.addEventListener('input', invalidate);
  form.addEventListener('reset', () => {
    invalidate();
    message.textContent = 'Documents cleared. Add two disclosures to begin.';
  });
  for (const side of ['earlier', 'later']) {
    const file = document.querySelector<HTMLInputElement>(`#${side}-file`)!;
    const area = side === 'earlier' ? earlier : later;
    file.addEventListener('change', async () => {
      invalidate();
      const selected = file.files?.[0];
      if (!selected) return;
      if (
        !selected.name.toLowerCase().endsWith('.txt') ||
        selected.size > 2_000_000
      ) {
        message.textContent = 'Choose a UTF-8 .txt file no larger than 2 MB.';
        file.value = '';
        return;
      }
      try {
        const text = await selected.text();
        if (file.files?.[0] !== selected) return;
        if (text.length > 500000 || text.includes('\u0000')) throw new Error();
        area.value = text;
        invalidate();
        message.textContent = `Opened ${selected.name}. Compare when both documents are ready.`;
      } catch {
        message.textContent =
          'Could not read this text file. Paste a section of up to 500,000 characters instead.';
        file.value = '';
      }
    });
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    stop();
    if (!form.reportValidity()) return;
    results.hidden = true;
    button.disabled = true;
    button.textContent = 'Comparing…';
    form.setAttribute('aria-busy', 'true');
    message.textContent = 'Comparing locally…';
    try {
      worker = new Worker(new URL('../workers/filings.ts', import.meta.url), {
        type: 'module',
      });
      timeout = setTimeout(() => {
        stop();
        message.textContent =
          'Comparison took too long. Try a smaller section.';
      }, 6000);
      worker.onerror = () => {
        stop();
        message.textContent =
          'The comparison could not run. Reload and try a smaller section.';
      };
      worker.onmessage = (event) => {
        stop();
        const data = event.data as {
          error?: string;
          changes?: {
            kind: 'added' | 'removed' | 'unchanged';
            text: string;
            lines: number;
          }[];
        };
        if (data.error || !data.changes) {
          message.textContent = data.error || 'Comparison unavailable.';
          return;
        }
        let added = 0,
          removed = 0;
        const fragment = document.createDocumentFragment();
        data.changes.forEach((part) => {
          if (part.kind === 'added') added += part.lines;
          if (part.kind === 'removed') removed += part.lines;
          const section = document.createElement('section');
          section.className = `diff-part diff-${part.kind}`;
          const label = document.createElement('p');
          label.className = 'eyebrow';
          label.textContent = `${part.kind} · ${part.lines} ${part.lines === 1 ? 'line' : 'lines'}`;
          const text = document.createElement('p');
          text.className = 'diff-text';
          text.textContent = part.text;
          section.append(label, text);
          fragment.append(section);
        });
        diff.replaceChildren(fragment);
        diff.classList.toggle('changes-only', toggle.checked);
        message.textContent =
          added || removed
            ? `${added} lines added · ${removed} lines removed. Review the surrounding language below.`
            : 'No textual changes after whitespace normalization.';
        results.hidden = false;
      };
      worker.postMessage({ earlier: earlier.value, later: later.value });
    } catch {
      stop();
      message.textContent =
        'Your browser could not start the comparison. Please reload and try again.';
    }
  });
  toggle.addEventListener('change', () =>
    diff.classList.toggle('changes-only', toggle.checked),
  );
  document
    .querySelector<HTMLFormElement>('#sec-search')
    ?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.querySelector<HTMLInputElement>('#sec-company')!;
      if (input.value.trim())
        window.open(
          `https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(input.value.trim())}&filter_forms=10-K%252C10-Q`,
          '_blank',
          'noopener,noreferrer',
        );
    });
  window.addEventListener('pagehide', stop);
}
