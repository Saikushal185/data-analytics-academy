// Data Visualization & Dashboards track.
export const lessons = [
  {
    id: 'viz-chart-choice',
    title: 'Choosing the Right Chart',
    blocks: [
      { p: 'Pick the chart from the question you are answering, not the shape of the data.' },
      { ul: [
        'Change over time → line.',
        'Compare categories → sorted bar (horizontal if labels are long).',
        'Part-to-whole → stacked bar or treemap; a pie only for 2–3 slices.',
        'Correlation → scatter (add a trend line).',
        'Distribution → histogram or box plot.',
        'Geographic → map only when location is the insight.',
      ] },
      { note: 'Avoid dual-axis charts and 3D — they distort comparisons and mislead.' },
    ],
  },
  {
    id: 'viz-preattentive',
    title: 'Pre-Attentive Attributes',
    blocks: [
      { p: 'The eye processes some visual properties in milliseconds, before conscious attention. Use them to direct focus.' },
      { ul: [
        'Position and length are the most accurately perceived — why bars and lines beat pie slices/area.',
        'Color hue and intensity draw the eye — reserve a bold color for the ONE thing that matters.',
        'Size, orientation, and enclosure can group or highlight.',
      ] },
      { note: 'If everything is highlighted, nothing is. Default most marks to neutral grey and spend color on the message.' },
    ],
  },
  {
    id: 'viz-color',
    title: 'Color & Accessibility',
    blocks: [
      { p: 'Color is powerful and easily misused. Treat it as an intentional encoding.' },
      { ul: [
        'Sequential palettes for ordered values (light→dark); diverging for above/below a midpoint; categorical (distinct hues) for unordered groups.',
        '~8% of men have color-vision deficiency — do not rely on red/green alone; add labels, position, or patterns.',
        'Ensure sufficient contrast; test with a color-blindness simulator.',
        'Keep category colors consistent across a report.',
      ] },
    ],
  },
  {
    id: 'viz-dashboard',
    title: 'Dashboard Layout & Hierarchy',
    blocks: [
      { p: 'A dashboard is a product. Design for how people read and decide, not for how much you can cram in.' },
      { ul: [
        'Most important KPI top-left (Western reading order); details below/right.',
        'Group related metrics; use whitespace to separate sections.',
        'Provide context: targets, prior period, and clear time ranges.',
        'Limit the number of views — a focused dashboard beats a wall of charts.',
        'Make filters obvious and titles describe the takeaway, not just the dimension.',
      ] },
    ],
  },
  {
    id: 'viz-junk',
    title: 'Chart Junk & Data-Ink',
    blocks: [
      { p: "Tufte's principle: maximize the data-ink ratio. Every pixel should carry information." },
      { ul: [
        'Remove heavy gridlines, borders, backgrounds, and redundant legends.',
        'Label data directly instead of forcing legend lookups.',
        'Start bar-chart axes at zero (truncating exaggerates differences).',
        'Sort bars by value, not alphabetically, unless order has meaning.',
      ] },
    ],
  },
  {
    id: 'viz-cheatsheet',
    title: 'Cheat Sheet',
    blocks: [
      { h: 'Chart picker' },
      { ul: ['Trend → line', 'Compare → sorted bar', 'Part-to-whole → stacked bar', 'Relationship → scatter', 'Distribution → histogram/box'] },
      { h: 'Polish' },
      { ul: ['One chart = one idea', 'Grey by default, color for the message', 'Zero baseline on bars', 'Direct labels > legends', 'Title states the takeaway'] },
    ],
  },
]

export const quiz = [
  { id: 'q-viz-1', q: 'Best chart to show monthly revenue over two years:',
    options: ['Pie', 'Line', 'Treemap', '3D bar'], answer: 1,
    why: 'Lines encode change over continuous time most clearly.' },
  { id: 'q-viz-2', q: 'Which encodings are perceived most accurately?',
    options: ['Color hue and area', 'Position and length', 'Angle and volume', '3D depth'],
    answer: 1, why: 'Position and length are read most precisely — why bars/lines beat pies.' },
  { id: 'q-viz-3', q: 'A bar chart axis should start at:',
    options: ['The minimum value', 'Zero', 'The mean', 'Anywhere that looks good'],
    answer: 1, why: 'Truncating a bar axis exaggerates differences and misleads; bars need a zero baseline.' },
  { id: 'q-viz-4', q: 'To respect color-blind users you should:',
    options: ['Use red/green for good/bad', 'Add labels/position and use color-safe palettes', 'Use more colors', 'Rely on hue alone'],
    answer: 1, why: 'Do not encode meaning by red/green alone; reinforce with labels, position, and safe palettes.' },
  { id: 'q-viz-5', q: 'High data-ink ratio means:',
    options: ['More gridlines and borders', 'Most pixels convey information; remove decoration', 'Bigger fonts', '3D effects'],
    answer: 1, why: 'Maximize ink that encodes data; strip chart junk like heavy gridlines and backgrounds.' },
]

export const interview = [
  { id: 'iv-viz-1', q: 'How do you decide which chart to use?',
    a: 'I start from the question and the relationship I want to show — trend, comparison, part-to-whole, correlation, or distribution — and pick the encoding that the eye reads most accurately (position/length over angle/area). Then I simplify: sort, label directly, default to neutral color, and spend a bold color only on the point the audience should remember.' },
  { id: 'iv-viz-2', q: 'What makes a dashboard effective?',
    a: 'It answers a specific set of decisions for a specific audience. The most important KPI sits top-left with context (target, prior period), related metrics are grouped, filters are obvious, titles state takeaways, and the number of views is limited so the signal is not buried. It loads fast and uses consistent, accessible color.' },
]

export const capstone = {
  id: 'cap-viz',
  title: 'Capstone: Critique & Redesign',
  blocks: [
    { p: 'Find a real dashboard or chart (yours or public) and write a short redesign brief.' },
    { ul: [
      'Name the audience and the decisions it should support.',
      'List three problems (chart choice, color, layout, or chart junk).',
      'Propose specific fixes and the single most important KPI to feature.',
    ] },
  ],
}
