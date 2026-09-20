export interface Project {
  id: 'hypocenter' | 'nfa' | 'expectations' | 'filings';
  number: string;
  name: string;
  category: string;
  description: string;
  href: string;
  status:
    | 'FRED observations'
    | 'Scenario calculator'
    | 'Local comparison'
    | 'Research notebook';
}

export const projects: readonly Project[] = [
  {
    id: 'hypocenter',
    number: '01',
    name: 'Hypocenter',
    category: 'Macro',
    description: 'Read the economic environment through macroeconomic signals.',
    href: '/macro/',
    status: 'FRED observations',
  },
  {
    id: 'nfa',
    number: '02',
    name: 'Not Financial Advice',
    category: 'Research',
    description:
      'Company observations, working theses, and a dated research history.',
    href: '/research/',
    status: 'Research notebook',
  },
  {
    id: 'expectations',
    number: '03',
    name: 'Expectations',
    category: 'Valuation',
    description:
      'Reverse-engineer the assumptions embedded in a company’s valuation.',
    href: '/valuation/',
    status: 'Scenario calculator',
  },
  {
    id: 'filings',
    number: '04',
    name: 'Filings',
    category: 'Fundamentals',
    description: 'See what changed between company filings.',
    href: '/filings/',
    status: 'Local comparison',
  },
];
