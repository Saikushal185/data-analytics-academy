// Statistics & A/B Testing track.
export const lessons = [
  {
    id: 'stats-descriptive',
    title: 'Distributions & Descriptive Stats',
    blocks: [
      { p: 'Before modeling anything, describe it. Central tendency (mean, median, mode) and spread (variance, standard deviation, IQR) summarize a distribution.' },
      { ul: [
        'Mean is sensitive to outliers; median is robust. Skewed data (income, revenue) → prefer median.',
        'Standard deviation = typical distance from the mean; variance is its square.',
        'IQR (Q3 − Q1) and box plots reveal spread and outliers without assuming normality.',
        'Always plot the distribution before trusting a single number.',
      ] },
      { note: "Anscombe's quartet: four datasets with identical means, variances, and correlations but totally different shapes. Summary stats lie without a plot." },
    ],
  },
  {
    id: 'stats-sampling',
    title: 'Sampling & the Central Limit Theorem',
    blocks: [
      { p: 'We rarely measure a whole population, so we sample. Good inference depends on the sample being representative.' },
      { ul: [
        'Random sampling avoids bias; convenience samples mislead.',
        'The Central Limit Theorem: the distribution of the sample MEAN approaches normal as n grows, regardless of the underlying distribution. This is why we can use normal-based confidence intervals.',
        'Standard error = sd / sqrt(n): more data → tighter estimates, with diminishing returns (need 4x data to halve the error).',
      ] },
      { note: 'Bigger samples shrink random error, not bias. A biased sampling method stays biased no matter how large.' },
    ],
  },
  {
    id: 'stats-causation',
    title: 'Correlation vs Causation',
    blocks: [
      { p: 'Correlation measures how two variables move together (−1 to +1). It does not establish that one causes the other.' },
      { ul: [
        'Confounder — a hidden third variable drives both (ice-cream sales & drownings ← summer heat).',
        'Reverse causation — Y may cause X.',
        'Selection bias — the sample is not representative.',
      ] },
      { p: 'The gold standard for causation is a randomized experiment, because randomization balances confounders on average.' },
    ],
  },
  {
    id: 'stats-hypothesis',
    title: 'Hypothesis Testing',
    blocks: [
      { p: 'A hypothesis test asks: could the difference I see be just random noise?' },
      { ul: [
        'Null (H0): no real effect. Alternative (H1): there is one.',
        'p-value: probability of data this extreme IF H0 were true. Small p (< α, often 0.05) → reject H0.',
        'A p-value is NOT the probability the hypothesis is true, nor the effect size.',
      ] },
      { h: 'Two errors' },
      { ul: [
        'Type I (false positive): rejecting a true null. Controlled by α.',
        'Type II (false negative): missing a real effect. Related to power (1 − β).',
        'Power rises with larger effect size, larger sample, and higher α.',
      ] },
      { note: 'Statistical significance ≠ practical significance. With huge samples, a trivial lift can be "significant" yet worthless.' },
    ],
  },
  {
    id: 'stats-phacking',
    title: 'p-Hacking & Multiple Comparisons',
    blocks: [
      { p: 'If you test enough hypotheses, some will look significant by pure chance. At α = 0.05, testing 20 independent metrics yields ~1 false positive on average.' },
      { ul: [
        'p-hacking: trying many analyses/segments and reporting only the significant ones.',
        'Bonferroni correction: use α / m for m tests (conservative).',
        'Benjamini–Hochberg controls the false discovery rate (less conservative, common in practice).',
        'Pre-register your primary metric and analysis to avoid fishing.',
      ] },
    ],
  },
  {
    id: 'stats-abtest',
    title: 'A/B Testing End-to-End',
    blocks: [
      { p: 'An A/B test randomly splits users into control (A) and treatment (B), changes one thing, and measures a predefined metric.' },
      { h: 'Designing it well' },
      { ul: [
        'Pick ONE primary metric before starting.',
        'Compute required sample size from baseline rate, minimum detectable effect, α, and power (usually 80%).',
        'Randomize at the right unit (often the user, not the page view).',
        'Run for whole business cycles (full weeks) to avoid day-of-week bias.',
      ] },
      { h: 'Common pitfalls' },
      { ul: [
        'Peeking & stopping early inflates false positives.',
        'Multiple comparisons across many metrics.',
        'Novelty effect — a lift that fades.',
        'Sample ratio mismatch — a 50/50 split landing at 48/52 signals a broken assignment; trust nothing until fixed.',
      ] },
    ],
  },
  {
    id: 'stats-power',
    title: 'Effect Size, Power & Sample Size (worked)',
    blocks: [
      { p: 'Before launching a test, estimate how many users you need to detect the smallest effect worth acting on (the MDE).' },
      { ul: [
        'Inputs: baseline conversion p, minimum detectable effect (absolute or relative), α (0.05), power (0.80).',
        'Bigger required n when: baseline near 0/1 is rare, MDE is small, or you want more power.',
        'A rough proportion-test rule: n per arm ≈ 16 · p(1−p) / (MDE)^2 for 80% power at α=0.05.',
      ] },
      { code: "# Example: baseline 10% conversion, want to detect +2 points (to 12%)\np = 0.10; mde = 0.02\nn = 16 * p*(1-p) / (mde**2)\n# ≈ 3600 users per arm" },
      { note: 'Effect size (e.g. Cohen\'s d, lift %) communicates magnitude. Always report it alongside the p-value.' },
    ],
  },
  {
    id: 'stats-regression',
    title: 'Confidence Intervals & Regression',
    blocks: [
      { p: 'A confidence interval gives a plausible range. A "95% CI" means: across many repeats, ~95% of such intervals contain the true value.' },
      { p: 'Linear regression fits y = b0 + b1·x. b1 is the expected change in y per one-unit change in x, holding other variables constant.' },
      { ul: [
        'R² — share of variance explained (0–1); high R² is not always good (overfitting).',
        'Coefficients have their own p-values and CIs.',
        'Logistic regression is the go-to when y is binary (converted / not).',
        'Beware multicollinearity — correlated predictors make coefficients unstable.',
      ] },
    ],
  },
  {
    id: 'stats-cheatsheet',
    title: 'Cheat Sheet',
    blocks: [
      { h: 'Which test?' },
      { ul: [
        'Compare two means → two-sample t-test (or Mann–Whitney if non-normal).',
        'Compare two proportions (conversion) → z-test for proportions / chi-square.',
        '3+ groups → ANOVA.',
        'Relationship between two numerics → correlation / regression.',
      ] },
      { h: 'Rules of thumb' },
      { ul: [
        'p < 0.05 → statistically significant (by convention, not law).',
        'Report effect size + CI, not just the p-value.',
        'Power 80%, α 5% are common defaults.',
        'Standard error scales as 1/sqrt(n).',
      ] },
    ],
  },
]

export const quiz = [
  { id: 'q-stats-1', q: 'A p-value of 0.03 means:',
    options: ['3% chance the null is true', 'The effect is large', 'If the null were true, data this extreme occurs ~3% of the time', '97% chance the alternative is true'],
    answer: 2, why: 'The p-value is P(data this extreme | H0 true) — not the probability a hypothesis is true, and not effect size.' },
  { id: 'q-stats-2', q: 'Ice cream sales correlate with drownings. Most likely:',
    options: ['Ice cream causes drowning', 'A confounder (hot weather) drives both', 'Drowning causes ice cream sales', 'Pure coincidence'],
    answer: 1, why: 'Summer heat increases swimming and ice cream sales — a classic confounder.' },
  { id: 'q-stats-3', q: 'Stopping an A/B test the moment it looks significant causes:',
    options: ['Higher power', 'Inflated false-positive (Type I) rate', 'A larger true effect', 'No problem if p < 0.05'],
    answer: 1, why: 'Repeated peeking gives randomness many chances to cross the threshold. Fix sample size in advance.' },
  { id: 'q-stats-4', q: 'Significant (p=0.001) but lifts revenue 0.02%. You should:',
    options: ['Ship it — significance is what matters', 'Weigh practical significance; tiny effects may not be worth it', 'Rerun until p>0.05', 'Conclude the test broke'],
    answer: 1, why: 'Large samples make trivial effects significant. Statistical ≠ practical significance.' },
  { id: 'q-stats-5', q: 'Your 50/50 experiment runs at 47/53. This indicates:',
    options: ['Success', 'Sample ratio mismatch — assignment may be broken', 'High power', 'A confounder'],
    answer: 1, why: 'A split far from intended (SRM) signals a bug in assignment/logging — investigate before trusting metrics.' },
  { id: 'q-stats-6', q: 'Testing 20 metrics at α=0.05, by chance you expect about:',
    options: ['0 false positives', '1 false positive', '5 false positives', '10 false positives'],
    answer: 1, why: '20 × 0.05 = 1 expected false positive. Correct with Bonferroni or FDR.' },
  { id: 'q-stats-7', q: 'To halve your standard error you must roughly:',
    options: ['Double the sample', 'Quadruple the sample', 'Halve the sample', 'It cannot change'],
    answer: 1, why: 'SE scales as 1/sqrt(n), so 4× the data halves the error — diminishing returns.' },
]

export const interview = [
  { id: 'iv-stats-1', q: 'How would you design an A/B test for a new checkout button?',
    a: 'Define the primary metric (e.g. checkout conversion) and guardrails (revenue, latency). Pick the randomization unit (user). Estimate sample size from baseline rate, MDE, α=0.05, power=0.80. Randomize, run for full weeks, avoid peeking. Analyze with a two-proportion test, report effect size + CI, check for sample ratio mismatch, and consider novelty effects before rolling out.' },
  { id: 'iv-stats-2', q: 'Explain p-value to a non-technical stakeholder.',
    a: 'It is the chance of seeing a result at least this big purely by luck if the change actually did nothing. A small p-value means luck is an unlikely explanation, so we believe the change had a real effect — but it does not tell us how big or important that effect is.' },
  { id: 'iv-stats-3', q: 'What is the difference between Type I and Type II error?',
    a: 'Type I (false positive): concluding there is an effect when there is not (controlled by α). Type II (false negative): missing a real effect (1 − power). There is a trade-off: lowering α raises Type II risk unless you increase sample size.' },
  { id: 'iv-stats-4', q: 'A metric jumped 30% week-over-week. How do you investigate?',
    a: 'First confirm it is real: check for tracking/logging changes, bot traffic, seasonality, and whether the denominator changed. Segment by source/device/geo to localize it. Compare against correlated metrics. Only after ruling out artifacts do I attribute it to a genuine behavioral or product change.' },
]

export const capstone = {
  id: 'cap-stats',
  title: 'Capstone: Analyze an A/B Test',
  blocks: [
    { p: 'You ran a test: control had 1,000 users with 100 conversions; treatment had 1,000 users with 130 conversions.' },
    { ul: [
      'Compute each conversion rate and the absolute & relative lift.',
      'State H0/H1 and run a two-proportion z-test (by hand or in the pandas track).',
      'Decide: is the lift statistically AND practically significant? What guardrails would you check before shipping?',
      'Write a 3-sentence recommendation a PM could act on.',
    ] },
  ],
}
