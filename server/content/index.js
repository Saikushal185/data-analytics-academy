// Assembles all track content into the payload served at GET /api/content.
// SQL `expected` queries and the seed are kept server-side only (for grading).
import * as sql from './sql.js'
import * as stats from './stats.js'
import * as python from './python.js'
import * as modeling from './modeling.js'
import * as business from './business.js'
import * as excel from './excel.js'
import * as dataviz from './dataviz.js'
import * as giteng from './giteng.js'

export const contentVersion = 2

// Track metadata. `label` replaces the old emoji icons (minimalist, text-only).
const meta = [
  { id: 'sql', label: 'SQL', title: 'SQL (Deep Dive)', blurb: 'The #1 tested analytics skill — window functions, CTEs, tricky joins, performance, and 16 graded challenges.', mod: sql },
  { id: 'stats', label: 'STAT', title: 'Statistics & A/B Testing', blurb: 'The analytical-thinking core: distributions, causation, hypothesis tests, experiments, power, and regression.', mod: stats },
  { id: 'python', label: 'PY', title: 'Python / pandas', blurb: 'From scripting to real analysis: groupby, merge, reshaping, vectorization, cleaning, time series — with live exercises.', mod: python },
  { id: 'modeling', label: 'MODEL', title: 'Data Modeling', blurb: 'Star schemas, grain, slowly changing dimensions, additivity, and the modern warehouse.', mod: modeling },
  { id: 'business', label: 'BIZ', title: 'Business Storytelling', blurb: 'Turn questions into metrics, build metric trees, choose the right chart, and drive decisions.', mod: business },
  { id: 'excel', label: 'BI', title: 'Excel & Power BI (DAX)', blurb: 'Modern Excel formulas, PivotTables, Power Query, and DAX measures, context, and time intelligence.', mod: excel },
  { id: 'dataviz', label: 'VIZ', title: 'Data Visualization', blurb: 'Chart selection, pre-attentive attributes, color/accessibility, dashboard layout, and removing chart junk.', mod: dataviz },
  { id: 'giteng', label: 'ENG', title: 'Git & Analytics Engineering', blurb: 'Version control, the modern data stack, dbt models/tests, ELT, and CI for analytics.', mod: giteng },
]

export const roadmap = meta.map((m) => m.id)

// Side-panel study aids per track: quick key-term glossary + a pro tip.
// Rendered in the right rail to fill space with something useful while learning.
const asides = {
  sql: {
    terms: [
      ['Grain', 'What one row represents — define it before aggregating.'],
      ['Window function', 'Computes across related rows without collapsing them.'],
      ['CTE', 'A named WITH query that makes multi-step logic readable.'],
      ['Anti-join', 'Rows in A with no match in B — use NOT EXISTS.'],
      ['Fan-out', 'A one-to-many join multiplying rows and inflating sums.'],
    ],
    tip: 'Stuck on a challenge? Run a plain SELECT first to see the data, then build the logic up one clause at a time.',
  },
  stats: {
    terms: [
      ['p-value', 'P(data this extreme | null true). Not the chance the hypothesis is true.'],
      ['Power', 'Chance of detecting a real effect (1 − β); rises with sample size.'],
      ['MDE', 'Minimum detectable effect — the smallest lift worth detecting.'],
      ['Type I / II', 'False positive / false negative.'],
      ['SRM', 'Sample ratio mismatch — a broken experiment split.'],
    ],
    tip: 'Always pair a p-value with an effect size and confidence interval — significance without magnitude is meaningless.',
  },
  python: {
    terms: [
      ['Series / DataFrame', 'One column / a full table.'],
      ['transform()', 'GroupBy result aligned back to every row (like a window).'],
      ['Vectorize', 'Operate on whole columns instead of looping rows.'],
      ['merge validate', "Raise on unexpected key cardinality, e.g. 'm:1'."],
      ['coerce', 'Turn bad parses into NaN instead of crashing.'],
    ],
    tip: 'Before and after every merge, check df.shape — an unexpected row count is the #1 source of silent bugs.',
  },
  modeling: {
    terms: [
      ['Fact table', 'One row per event; numeric measures + foreign keys.'],
      ['Dimension', 'Descriptive context: who / what / where / when.'],
      ['SCD Type 2', 'Versioned dimension rows preserving history.'],
      ['Surrogate key', 'Warehouse-generated integer key.'],
      ['Additivity', 'Whether a measure can be summed across a dimension.'],
    ],
    tip: 'Almost every model benefits from a dedicated date dimension — build one early.',
  },
  business: {
    terms: [
      ['BLUF', 'Bottom Line Up Front — lead with the recommendation.'],
      ['Metric tree', 'Decompose a KPI into the drivers behind it.'],
      ['Guardrail metric', "A metric that must not regress while you optimize another."],
      ['Leading indicator', 'Predicts; a lagging indicator confirms.'],
    ],
    tip: 'Before analyzing, ask: "What decision does this inform?" If there is no decision, there is no analysis.',
  },
  excel: {
    terms: [
      ['Measure', 'DAX computed at query time in filter context.'],
      ['Calculated column', 'Row-by-row value stored on the table.'],
      ['CALCULATE', 'Evaluate an expression in a modified filter context.'],
      ['Filter vs row context', 'Applied filters vs "the current row".'],
      ['Power Query', 'Repeatable, refreshable cleaning/ETL steps.'],
    ],
    tip: 'Use measures (not calculated columns) for totals and ratios so they respond to slicers and stay memory-light.',
  },
  dataviz: {
    terms: [
      ['Pre-attentive', 'Visual cues read in milliseconds (position, color).'],
      ['Data-ink ratio', 'Maximize pixels that encode data; cut decoration.'],
      ['Sequential / diverging', 'Palettes for ordered values / above-below a midpoint.'],
      ['Chart junk', 'Gridlines, 3D, borders that add no information.'],
    ],
    tip: 'Default every mark to neutral grey and spend one bold color on the single point you want remembered.',
  },
  giteng: {
    terms: [
      ['Branch / PR', 'Isolated work, then reviewed before merge.'],
      ['ELT', 'Load raw first, transform in the warehouse.'],
      ['dbt model', 'A SELECT materialized as a view/table.'],
      ['ref()', 'Links models into a dependency DAG.'],
      ['CI', 'Run tests automatically on every PR.'],
    ],
    tip: 'Keep branches small and short-lived — big branches mean painful merge conflicts.',
  },
}

// Public topic objects (no answer keys).
export const topics = meta.map((m) => ({
  id: m.id,
  label: m.label,
  title: m.title,
  blurb: m.blurb,
  lessons: m.mod.lessons,
  quiz: m.mod.quiz,
  interview: m.mod.interview,
  capstone: m.mod.capstone,
  aside: asides[m.id] || null,
}))

// SQL challenges for the client — WITHOUT the `expected` answer.
const publicChallenges = sql.challenges.map(({ expected, ...rest }) => rest)

export const publicContent = {
  contentVersion,
  roadmap,
  topics,
  sql: { challenges: publicChallenges },
  python: { preamble: python.pyPreamble, exercises: python.exercises },
}

// Server-only lookups used by the SQL grading route.
export const sqlSeed = sql.seedSql
export const sqlChallengeById = Object.fromEntries(sql.challenges.map((c) => [c.id, c]))
