import {
  enterpriseValueAtGrowth,
  solveGrowth,
  type DcfInputs,
} from '../lib/valuation/model';
export function initializeValuation() {
  const form = document.querySelector<HTMLFormElement>('#valuation-form');
  if (!form) return;
  const message = document.querySelector<HTMLElement>('#model-message')!;
  const results = document.querySelector<HTMLElement>('#model-results')!;
  const provenance = document.querySelector<HTMLElement>('#model-provenance')!;
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const amount = (v: number) =>
    v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  let csv = '';
  const cell = (row: HTMLTableRowElement, value: string, heading = false) => {
    const el = document.createElement(heading ? 'th' : 'td');
    el.textContent = value;
    row.append(el);
    return el;
  };
  function calculate() {
    results.hidden = true;
    if (!form!.reportValidity()) return;
    try {
      const p = Object.fromEntries(
        [...new FormData(form!).entries()].map(([k, v]) => [
          k,
          Number(v) /
            (['enterpriseValue', 'revenue', 'forecastYears'].includes(k)
              ? 1
              : 100),
        ]),
      ) as unknown as DcfInputs;
      const growth = solveGrowth(p);
      if (growth === null)
        throw new Error(
          'No solution between −99% and 500% annual growth. Recheck the amounts and assumptions.',
        );
      const model = enterpriseValueAtGrowth(p, growth);
      document.querySelector('#implied-growth')!.textContent = pct(growth);
      document.querySelector('#growth-context')!.textContent =
        `Each year for ${p.forecastYears} years, with a ${pct(p.operatingMargin)} operating margin.`;
      document.querySelector('#final-revenue')!.textContent = amount(
        model.rows.at(-1)!.revenue,
      );
      document.querySelector('#terminal-share')!.textContent = pct(
        model.discountedTerminal / model.value,
      );
      const table = document.querySelector<HTMLTableElement>(
        '#sensitivity-results',
      )!;
      const head = table.tHead!;
      head.replaceChildren();
      const header = head.insertRow();
      cell(header, 'Margin / WACC', true);
      const rates = [-0.02, -0.01, 0, 0.01, 0.02].map(
        (delta) => p.discountRate + delta,
      );
      rates.forEach((rate) =>
        cell(header, pct(rate), true).setAttribute('scope', 'col'),
      );
      const body = table.tBodies[0];
      body.replaceChildren();
      [-0.05, -0.025, 0, 0.025, 0.05].forEach((delta) => {
        const margin = p.operatingMargin + delta,
          row = body.insertRow();
        cell(row, pct(margin), true).setAttribute('scope', 'row');
        rates.forEach((rate) => {
          let required: number | null = null;
          try {
            required = solveGrowth({
              ...p,
              operatingMargin: margin,
              discountRate: rate,
            });
          } catch {
            /* Invalid scenarios are unavailable. */
          }
          const td = cell(row, required === null ? '—' : pct(required));
          if (delta === 0 && rate === p.discountRate) {
            td.className = 'selected-scenario';
            td.setAttribute(
              'aria-label',
              `${td.textContent}, current scenario`,
            );
          }
        });
      });
      const flowBody =
        document.querySelector<HTMLTableElement>('#cashflow-results')!
          .tBodies[0];
      flowBody.replaceChildren();
      model.rows.forEach((item) => {
        const row = flowBody.insertRow();
        [
          String(item.year),
          amount(item.revenue),
          amount(item.cashFlow),
          amount(item.presentValue),
        ].forEach((v) => cell(row, v));
      });
      csv = [
        'Signal House simplified DCF',
        provenance.textContent,
        'All amounts in the user input unit',
        ...Object.entries(p).map(([k, v]) => `${k},${v}`),
        `impliedGrowth,${growth}`,
        `discountedTerminalValue,${model.discountedTerminal}`,
        'Year,Revenue,Free cash flow,Present value',
        ...model.rows.map((r) =>
          [r.year, r.revenue, r.cashFlow, r.presentValue].join(','),
        ),
      ].join('\n');
      results.hidden = false;
      message.textContent =
        'Calculated from the inputs shown. This is a scenario, not a price target.';
      message.classList.remove('is-error');
    } catch (e) {
      message.textContent =
        e instanceof Error ? e.message : 'Check your inputs.';
      message.classList.add('is-error');
    }
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
  });
  form.addEventListener('input', () => {
    message.classList.remove('is-error');
    provenance.textContent = 'USER-EDITED INPUTS';
    results.hidden = true;
    message.textContent =
      'Inputs changed. Calculate again to update the results.';
  });
  form.addEventListener('reset', () => {
    message.classList.remove('is-error');
    provenance.textContent = 'ILLUSTRATIVE INPUTS';
    results.hidden = true;
    message.textContent =
      'Example restored. Calculate to see its implied growth.';
  });
  document.querySelector('#export-model')?.addEventListener('click', () => {
    if (results.hidden || !csv) return;
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signalhouse-valuation.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  calculate();
}
