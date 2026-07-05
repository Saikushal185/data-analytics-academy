// Business Storytelling track.
export const lessons = [
  {
    id: 'biz-question',
    title: 'From Vague Question to Metric',
    blocks: [
      { p: 'Stakeholders ask fuzzy questions ("are we doing well?"). Your job is to translate them into a measurable, answerable form.' },
      { ul: [
        'Clarify the decision behind the question — what will they DO differently with the answer?',
        'Define the metric precisely: numerator, denominator, time window, population.',
        'Agree the definition before analyzing, so results are not relitigated later.',
      ] },
      { note: '"Active users" can mean five different things. Pin the definition down in writing first.' },
    ],
  },
  {
    id: 'biz-metric-trees',
    title: 'Metric Trees & Driver Analysis',
    blocks: [
      { p: 'A metric tree decomposes a top-line metric into the levers that drive it, so you can localize a change.' },
      { ul: [
        'Revenue = users × conversion × average order value.',
        'When revenue drops, walk the tree to find which factor moved.',
        'Good for both diagnosis ("why did it change?") and planning ("which lever should we pull?").',
      ] },
      { code: "Revenue\n├─ Traffic (sessions)\n├─ Conversion rate\n└─ Average order value\n   ├─ Items per order\n   └─ Price per item" },
    ],
  },
  {
    id: 'biz-kpi',
    title: 'Defining Good KPIs',
    blocks: [
      { p: 'A good KPI is tied to a goal, hard to game, and actionable.' },
      { ul: [
        'Pair metrics to prevent gaming (speed AND quality, growth AND retention).',
        'Prefer rates/ratios over raw counts for comparability.',
        'Use guardrail metrics in experiments so a win on one metric does not quietly hurt another.',
        'Leading indicators predict; lagging indicators confirm.',
      ] },
    ],
  },
  {
    id: 'biz-charts',
    title: 'Choosing the Right Chart',
    blocks: [
      { p: 'The chart type should match the question, not the data type.' },
      { ul: [
        'Trend over time → line chart.',
        'Compare categories → bar chart (sorted).',
        'Part-to-whole → stacked bar or, sparingly, a single pie.',
        'Relationship between two numerics → scatter.',
        'Distribution → histogram / box plot.',
      ] },
      { note: 'One chart, one idea. Strip gridlines, label directly, and highlight the single point you want remembered.' },
    ],
  },
  {
    id: 'biz-story',
    title: 'Communicating with Data',
    blocks: [
      { p: 'A great analysis nobody acts on is wasted. Structure the message for the audience.' },
      { ul: [
        'Lead with the answer/recommendation, then support it (BLUF: bottom line up front).',
        'Quantify impact in business language ($, %, time).',
        'State assumptions and limitations honestly — it builds trust.',
        'Tailor depth: executives want the "so what" in 30 seconds; put nuance in an appendix.',
      ] },
    ],
  },
  {
    id: 'biz-stakeholders',
    title: 'Stakeholder Management',
    blocks: [
      { p: 'Analytics is a service; managing expectations is half the value you deliver.' },
      { ul: [
        'Scope before you build: confirm the question, the decision, and the deadline.',
        'Push back on vanity metrics and ill-posed requests — propose a better question.',
        'Share interim findings early to avoid surprises and rework.',
        'Close the loop: what decision did the analysis drive, and what was the outcome?',
      ] },
    ],
  },
  {
    id: 'biz-cheatsheet',
    title: 'Cheat Sheet',
    blocks: [
      { h: 'Before analyzing' },
      { ul: ['What decision does this inform?', 'Exact metric definition (num/denom/window/population)?', 'What would change your recommendation?'] },
      { h: 'When presenting' },
      { ul: ['BLUF: recommendation first.', 'One chart = one idea.', 'Quantify impact in $/%.', 'State assumptions & limitations.'] },
    ],
  },
]

export const quiz = [
  { id: 'q-biz-1', q: 'A VP asks "are we doing well?" Best first move:',
    options: ['Build a 20-tab dashboard', "Ask what decision they'll make and define a precise metric", 'Run a regression', 'Export everything to Excel'],
    answer: 1, why: 'Clarify the decision and pin an exact metric definition before analyzing.' },
  { id: 'q-biz-2', q: 'Why pair a growth metric with a retention/quality metric?',
    options: ['To make the dashboard longer', 'To prevent gaming — one metric can be juiced at the business\'s expense', 'Regression needs two metrics', 'No real benefit'],
    answer: 1, why: 'Paired/guardrail metrics stop winning on one number while harming another.' },
  { id: 'q-biz-3', q: 'Best way to present to a busy executive:',
    options: ['Walk through every query', 'Lead with the recommendation (BLUF), then support it', 'Show all 30 charts', 'Send the raw notebook'],
    answer: 1, why: 'Bottom Line Up Front: answer and "so what" first, nuance in the appendix.' },
  { id: 'q-biz-4', q: 'Revenue fell. A metric tree helps you:',
    options: ['Make a prettier chart', 'Decompose revenue into drivers to localize which factor moved', 'Run an A/B test', 'Normalize the database'],
    answer: 1, why: 'Breaking revenue into traffic × conversion × AOV shows which lever changed.' },
  { id: 'q-biz-5', q: 'To show a trend over 12 months, the best chart is usually:',
    options: ['Pie chart', 'Line chart', 'Scatter plot', 'Stacked bar of everything'],
    answer: 1, why: 'Lines encode change over continuous time clearly; pies cannot show trend.' },
]

export const interview = [
  { id: 'iv-biz-1', q: 'How do you handle a stakeholder asking for a metric you think is misleading?',
    a: 'I acknowledge the underlying goal, explain specifically how the metric could mislead (e.g. it can be gamed or ignores a denominator), and propose an alternative that answers the real decision — ideally paired with a guardrail. I frame it collaboratively around the decision they need to make, not as a refusal.' },
  { id: 'iv-biz-2', q: 'Tell me how you would present a complex analysis to executives.',
    a: 'Lead with the recommendation and its quantified impact (BLUF). Support with two or three slides, one idea each, using the simplest chart that makes the point. State key assumptions and limitations. Keep methodology and detailed cuts in an appendix for those who ask. End with a clear next step or decision.' },
  { id: 'iv-biz-3', q: 'A dashboard shows engagement up but revenue flat. What do you do?',
    a: 'Use a metric tree to reconcile them: engagement might be rising among non-paying users, or conversion/AOV dropped offsetting traffic gains. I segment by user type and check whether the engagement metric is a leading indicator with a lag, or simply not tied to monetization — then recommend accordingly.' },
]

export const capstone = {
  id: 'cap-biz',
  title: 'Capstone: One-Page Executive Brief',
  blocks: [
    { p: 'Pick any analysis (e.g. your SQL or pandas capstone) and write a one-page brief for a VP.' },
    { ul: [
      'Open with a one-sentence recommendation and its quantified impact.',
      'Include exactly one chart that proves the point (describe it).',
      'List two assumptions/limitations.',
      'End with a single clear next step.',
    ] },
  ],
}
