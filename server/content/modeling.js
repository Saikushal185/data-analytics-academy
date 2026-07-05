// Data Modeling track.
export const lessons = [
  {
    id: 'model-star',
    title: 'Star Schema: Facts & Dimensions',
    blocks: [
      { p: 'A dimensional (star) model organizes data into fact tables (events/measurements) surrounded by dimension tables (descriptive context).' },
      { ul: [
        'Fact table — one row per event (a sale, a click). Numeric additive measures + foreign keys. Long and narrow.',
        'Dimension table — the who/what/where/when: customer, product, date. Short, wide, descriptive.',
        'Grain — what one fact row represents — is the single most important decision. Define it first.',
      ] },
      { p: 'This shape makes BI tools fast and intuitive: slice facts by any dimension attribute.' },
      { note: 'Build a date dimension (one row per calendar day with weekday, month, fiscal period, holiday flags) in almost every model.' },
    ],
  },
  {
    id: 'model-normalization',
    title: 'Normalization, Star vs Snowflake',
    blocks: [
      { p: 'Normalization removes redundancy by splitting data into related tables (3NF). It is great for transactional systems (OLTP) that write a lot.' },
      { ul: [
        'Star schema denormalizes dimensions for fast, simple analytical reads (OLAP).',
        'Snowflake schema normalizes dimensions into sub-tables — less redundancy, more joins, slower/clunkier for BI.',
        'Analytics generally favors denormalized stars; storage is cheap, query simplicity is valuable.',
      ] },
    ],
  },
  {
    id: 'model-scd',
    title: 'Slowly Changing Dimensions (SCD)',
    blocks: [
      { p: 'Dimension attributes change over time (a customer moves region). SCD types define how you record that.' },
      { ul: [
        'Type 1 — overwrite the old value (no history).',
        'Type 2 — add a new row with valid_from/valid_to (and an is_current flag) to preserve full history.',
        'Type 3 — keep a "previous value" column (limited history).',
      ] },
      { note: 'Type 2 is the workhorse for accurate point-in-time reporting ("revenue by the region the customer was in at the time").' },
    ],
  },
  {
    id: 'model-measures',
    title: 'Additive, Semi- & Non-Additive Measures',
    blocks: [
      { p: 'Not every measure can be summed across every dimension.' },
      { ul: [
        'Additive — sums across all dimensions (revenue, units).',
        'Semi-additive — sums across some but not time (account balance, inventory on hand): you average or take period-end over time.',
        'Non-additive — ratios/percentages (margin %): recompute from components, never sum.',
      ] },
      { note: 'Surrogate keys (integer keys generated in the warehouse) decouple your model from messy source keys and support SCD Type 2.' },
    ],
  },
  {
    id: 'model-etl',
    title: 'ETL / ELT & the Modern Stack',
    blocks: [
      { p: 'Data flows source → warehouse → models analysts query. Modern stacks load raw first, then transform in SQL (ELT).' },
      { ul: [
        'Staging models clean & standardize raw sources.',
        'Mart models are business-ready star schemas for dashboards.',
        'Idempotency & freshness — re-running should give the same result; know how current your data is.',
      ] },
    ],
  },
  {
    id: 'model-cheatsheet',
    title: 'Cheat Sheet',
    blocks: [
      { h: 'Design checklist' },
      { ul: [
        'State the fact grain in one sentence.',
        'Identify measures and classify additivity.',
        'List dimensions; decide SCD type per attribute.',
        'Use surrogate keys; always include a date dimension.',
        'Denormalize for BI; document the model.',
      ] },
    ],
  },
]

export const quiz = [
  { id: 'q-model-1', q: 'A fact table typically contains:',
    options: ['Descriptive text attributes', 'Numeric measures plus foreign keys to dimensions', 'One row per customer', 'Only date columns'],
    answer: 1, why: 'Facts hold additive measures and FKs; descriptive attributes live in dimensions.' },
  { id: 'q-model-2', q: 'The single most important fact-table decision is:',
    options: ['Which database', 'The grain — what one row represents', 'The table name', 'Index count'],
    answer: 1, why: 'Grain defines the meaning of every measure and FK; wrong grain causes double counting.' },
  { id: 'q-model-3', q: 'To preserve full history when a customer changes region, use:',
    options: ['SCD Type 1 (overwrite)', 'SCD Type 2 (new row with valid_from/to)', 'Delete the row', 'A surrogate key alone'],
    answer: 1, why: 'Type 2 versions the dimension so you can report point-in-time accurately.' },
  { id: 'q-model-4', q: 'An account balance summed across months is wrong because it is:',
    options: ['Additive', 'Semi-additive (not additive over time)', 'Non-additive', 'A surrogate key'],
    answer: 1, why: 'Balances are semi-additive: sum across accounts but not across time — take period-end or average.' },
  { id: 'q-model-5', q: 'Star vs snowflake for analytics, the usual choice is:',
    options: ['Snowflake — fewer rows', 'Star — denormalized, simpler/faster BI queries', 'Neither', 'Always 3NF'],
    answer: 1, why: 'Stars denormalize dimensions for fast, simple reads; snowflakes add joins that slow BI.' },
]

export const interview = [
  { id: 'iv-model-1', q: 'Walk me through designing a data model for an e-commerce orders dashboard.',
    a: 'Start with the fact grain — one row per order line item — and its additive measures (quantity, line revenue). Surround it with dimensions: date, customer, product, store, promotion, each with a surrogate key. Use SCD Type 2 on attributes that change (customer region, product price tier). Add a date dimension. Denormalize for BI, then build staging → mart models so dashboards query clean stars.' },
  { id: 'iv-model-2', q: 'What is the difference between OLTP and OLAP design?',
    a: 'OLTP (transactional) is highly normalized for fast, consistent writes and point lookups. OLAP (analytical) is denormalized into star schemas optimized for large aggregations and slicing. You typically ELT from OLTP sources into an OLAP warehouse.' },
]

export const capstone = {
  id: 'cap-model',
  title: 'Capstone: Model a Subscription Business',
  blocks: [
    { p: 'Sketch a dimensional model for a SaaS company tracking subscriptions and usage.' },
    { ul: [
      'Define at least one fact table and its grain.',
      'List dimensions and mark which attributes need SCD Type 2.',
      'Classify each measure as additive / semi-additive / non-additive (e.g. MRR, active seats, churn rate).',
      'Explain how you would compute monthly active accounts and revenue by the plan a customer was on at the time.',
    ] },
  ],
}
