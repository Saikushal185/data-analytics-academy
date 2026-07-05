// Python / pandas track.
export const pyPreamble = `import pandas as pd
df = pd.DataFrame({
    'city':   ['NY','LA','NY','SF','LA','NY'],
    'month':  ['Jan','Jan','Feb','Feb','Feb','Mar'],
    'sales':  [100, 80, 60, 120, 90, 70],
})
`

export const lessons = [
  {
    id: 'py-pandas-core',
    title: 'pandas Core: Select, Filter, Assign',
    blocks: [
      { p: 'A DataFrame is a table; a Series is one column. Most analysis is selecting, filtering, and creating columns.' },
      { code: "import pandas as pd\ndf[df['sales'] > 70]               # boolean filter\ndf.assign(tax=df['sales'] * 0.1)   # new column\ndf.loc[df.city == 'NY', 'sales']   # label-based select" },
      { ul: [
        'Use .loc[rows, cols] for label-based access; combine conditions with & and | (parenthesize each).',
        'Vectorize — operate on whole columns; avoid Python row loops.',
        'Prefer .loc assignment over chained indexing to avoid SettingWithCopyWarning.',
      ] },
    ],
  },
  {
    id: 'py-groupby',
    title: 'GroupBy & Aggregation',
    blocks: [
      { p: 'Split-apply-combine: split rows into groups, apply an aggregation, combine the result. The pandas equivalent of SQL GROUP BY.' },
      { code: "df.groupby('city')['sales'].sum()\n\ndf.groupby('city').agg(\n    total=('sales', 'sum'),\n    avg=('sales', 'mean'),\n    n=('sales', 'size'),\n)" },
      { ul: [
        'transform() returns a value per original row — like a SQL window function.',
        'agg() with named tuples gives clean, named output columns.',
        'size() counts rows incl. NaN; count() excludes NaN.',
      ] },
    ],
  },
  {
    id: 'py-merge-reshape',
    title: 'Merge, Pivot & Reshape',
    blocks: [
      { p: 'merge() is the JOIN. pivot_table reshapes long → wide; melt does wide → long.' },
      { code: "orders.merge(customers, on='customer_id', how='left', validate='m:1')\n\ndf.pivot_table(index='city', columns='month',\n                values='sales', aggfunc='sum', fill_value=0)\n\ndf.melt(id_vars='city', var_name='month', value_name='sales')" },
      { ul: [
        'Match how= to intent: inner/left/right/outer — same semantics as SQL.',
        "validate='m:1' raises if the key is not unique on the right — catches accidental fan-out.",
        'Check .shape before & after a merge.',
      ] },
    ],
  },
  {
    id: 'py-vectorize',
    title: 'Vectorization vs apply',
    blocks: [
      { p: 'Vectorized column operations run in optimized C and are far faster than Python-level loops or .apply over rows.' },
      { code: "# slow: row-wise apply\ndf['x'] = df.apply(lambda r: r.a + r.b, axis=1)\n# fast: vectorized\ndf['x'] = df['a'] + df['b']\n\n# conditional logic\nimport numpy as np\ndf['tier'] = np.where(df['sales'] > 90, 'high', 'low')\ndf['tier'] = pd.cut(df['sales'], bins=[0,80,100,999], labels=['lo','mid','hi'])" },
      { note: 'Reach for .apply only when no vectorized/builtin equivalent exists. axis=1 apply is the slowest common pattern.' },
    ],
  },
  {
    id: 'py-clean',
    title: 'Cleaning & Missing Data',
    blocks: [
      { p: 'Real data is dirty; cleaning is most of the job. Decide deliberately how to treat missing values — each choice changes conclusions.' },
      { code: "df = df.drop_duplicates()\ndf['amount'] = pd.to_numeric(df['amount'], errors='coerce')\ndf = df.dropna(subset=['amount'])      # drop\ndf['region'] = df['region'].fillna('Unknown')  # fill\ndf['is_missing'] = df['x'].isna()      # flag" },
      { ul: [
        'isna()/notna() to find gaps; fillna(), dropna(), or flag.',
        "errors='coerce' turns bad parses into NaN instead of crashing.",
        'Standardize text: .str.strip().str.lower().',
      ] },
    ],
  },
  {
    id: 'py-timeseries',
    title: 'Datetime & Time Series',
    blocks: [
      { p: 'Time features and resampling power most reporting.' },
      { code: "df['date'] = pd.to_datetime(df['date'])\ndf['month'] = df['date'].dt.to_period('M')\ndf['weekday'] = df['date'].dt.day_name()\n\n# Resample daily → monthly totals (date as index)\nts = df.set_index('date')\nts['amount'].resample('M').sum()\nts['amount'].rolling(7).mean()   # 7-period moving average" },
      { ul: [
        'Use the .dt accessor for year/month/weekday/hour.',
        'resample() is groupby for time; rolling()/expanding() give moving windows.',
      ] },
    ],
  },
  {
    id: 'py-cheatsheet',
    title: 'Cheat Sheet',
    blocks: [
      { h: 'Inspect' },
      { code: "df.head() | df.info() | df.describe()\ndf.shape | df.dtypes | df['c'].value_counts()" },
      { h: 'Select / filter' },
      { code: "df.loc[mask, ['a','b']] | df.iloc[0:5]\ndf.query('sales > 90 and city == \"NY\"')" },
      { h: 'Aggregate / reshape' },
      { code: "df.groupby('g').agg(t=('x','sum'))\ndf.pivot_table(index=.., columns=.., values=.., aggfunc=..)\ndf.merge(o, on='k', how='left')\ndf.sort_values('x', ascending=False)" },
    ],
  },
]

export const exercises = [
  { id: 'py-1', title: 'Filter rows', prompt: 'Print rows of df where sales > 90. Use print(...).',
    starter: "print(df[df['sales'] > ____])", solution: "print(df[df['sales'] > 90])",
    expectedOutput: "  city month  sales\n0   NY   Jan    100\n3   SF   Feb    120" },
  { id: 'py-2', title: 'GroupBy sum', prompt: 'Print total sales per city (a Series indexed by city).',
    starter: "print(df.groupby('____')['sales'].sum())", solution: "print(df.groupby('city')['sales'].sum())",
    expectedOutput: "city\nLA    170\nNY    230\nSF    120\nName: sales, dtype: int64" },
  { id: 'py-3', title: 'Named aggregation', prompt: 'Group by city; print columns total (sum) and n (row count).',
    starter: "print(df.groupby('city').agg(total=('sales','sum'), n=('sales','size')))",
    solution: "print(df.groupby('city').agg(total=('sales','sum'), n=('sales','size')))",
    expectedOutput: "      total  n\ncity\nLA      170  2\nNY      230  3\nSF      120  1" },
  { id: 'py-4', title: 'Pivot table', prompt: 'Pivot total sales: index city, columns month, fill_value=0. Print it.',
    starter: "print(df.pivot_table(index='city', columns='month', values='sales', aggfunc='sum', fill_value=0))",
    solution: "print(df.pivot_table(index='city', columns='month', values='sales', aggfunc='sum', fill_value=0))",
    expectedOutput: "month  Feb  Jan  Mar\ncity\nLA      90   80    0\nNY      60  100   70\nSF     120    0    0" },
  { id: 'py-5', title: 'transform a column', prompt: "Add city_total = each city's total sales aligned to every row, then print df. Hint: transform('sum').",
    starter: "df['city_total'] = df.groupby('city')['sales'].transform('____')\nprint(df)",
    solution: "df['city_total'] = df.groupby('city')['sales'].transform('sum')\nprint(df)",
    expectedOutput: "  city month  sales  city_total\n0   NY   Jan    100         230\n1   LA   Jan     80         170\n2   NY   Feb     60         230\n3   SF   Feb    120         120\n4   LA   Feb     90         170\n5   NY   Mar     70         230" },
  { id: 'py-6', title: 'Sort & head', prompt: 'Print the top 2 rows by sales (descending). Use sort_values then head(2).',
    starter: "print(df.sort_values('sales', ascending=False).head(2))",
    solution: "print(df.sort_values('sales', ascending=False).head(2))",
    expectedOutput: "  city month  sales\n3   SF   Feb    120\n0   NY   Jan    100" },
  { id: 'py-7', title: 'Conditional column', prompt: "Add tier = 'high' where sales > 90 else 'low' using numpy.where, then print df['tier'].tolist().",
    starter: "import numpy as np\ndf['tier'] = np.where(df['sales'] > 90, 'high', 'low')\nprint(df['tier'].tolist())",
    solution: "import numpy as np\ndf['tier'] = np.where(df['sales'] > 90, 'high', 'low')\nprint(df['tier'].tolist())",
    expectedOutput: "['high', 'low', 'low', 'high', 'low', 'low']" },
  { id: 'py-8', title: 'value_counts', prompt: 'Print how many rows each city has (value_counts of the city column).',
    starter: "print(df['city'].value_counts())", solution: "print(df['city'].value_counts())",
    expectedOutput: "city\nNY    3\nLA    2\nSF    1\nName: count, dtype: int64" },
  { id: 'py-9', title: 'Mean per month', prompt: 'Print average sales per month (Series indexed by month).',
    starter: "print(df.groupby('month')['sales'].mean())", solution: "print(df.groupby('month')['sales'].mean())",
    expectedOutput: "month\nFeb    90.0\nJan    90.0\nMar    70.0\nName: sales, dtype: float64" },
  { id: 'py-10', title: 'Share of total', prompt: "Add pct = each row's sales as % of grand total, rounded to 1 decimal, then print df['pct'].tolist().",
    starter: "df['pct'] = (100 * df['sales'] / df['sales'].sum()).round(1)\nprint(df['pct'].tolist())",
    solution: "df['pct'] = (100 * df['sales'] / df['sales'].sum()).round(1)\nprint(df['pct'].tolist())",
    expectedOutput: "[19.2, 15.4, 11.5, 23.1, 17.3, 13.5]" },
]

export const quiz = [
  { id: 'q-py-1', q: 'Which method is the SQL-window equivalent (result aligned to original rows)?',
    options: ['groupby().sum()', 'groupby().transform()', 'pivot_table()', 'drop_duplicates()'],
    answer: 1, why: 'transform() returns a value for every original row, like OVER(PARTITION BY ...).' },
  { id: 'q-py-2', q: "After merge(other, on='id', how='left') rows tripled. Likely cause:",
    options: ["how='left' is wrong", 'The key in other is not unique (one-to-many)', 'merge always triples rows', 'You needed pivot_table'],
    answer: 1, why: "A non-unique right key fans out rows. Use validate='m:1' and compare shapes." },
  { id: 'q-py-3', q: 'Convert daily rows to monthly totals on a datetime index with:',
    options: ["rolling('M')", "resample('M').sum()", "groupby('M')", "pivot('M')"],
    answer: 1, why: "resample('M') is groupby-for-time; .sum() aggregates each month. rolling() is for moving windows." },
  { id: 'q-py-4', q: 'Fastest way to add column c = a + b across a big DataFrame:',
    options: ["df.apply(lambda r: r.a+r.b, axis=1)", "df['c'] = df['a'] + df['b']", 'a Python for loop', 'iterrows()'],
    answer: 1, why: 'Vectorized column arithmetic runs in C; axis=1 apply and loops are far slower.' },
  { id: 'q-py-5', q: "errors='coerce' in pd.to_numeric does what to unparseable values?",
    options: ['Raises an error', 'Drops the row', 'Turns them into NaN', 'Leaves them as strings'],
    answer: 2, why: "coerce converts invalid parses to NaN so the operation does not crash; clean them afterward." },
  { id: 'q-py-6', q: 'Best fix for SettingWithCopyWarning:',
    options: ['Ignore it', 'Use .loc for assignment on the original frame', 'Wrap in try/except', 'Convert to numpy'],
    answer: 1, why: 'Chained indexing may write to a copy. Assign with df.loc[mask, col] = ... on the original.' },
]

export const interview = [
  { id: 'iv-py-1', q: 'When would you use .apply vs a vectorized operation?',
    a: 'Prefer vectorized operations and built-in methods — they run in C and are far faster. Use .apply only when there is no vectorized equivalent for the logic. Row-wise .apply(axis=1) is the slowest and should be a last resort, often replaceable by np.where, np.select, merges, or groupby.transform.' },
  { id: 'iv-py-2', q: 'How do you safely join two DataFrames and verify the result?',
    a: 'Choose how= to match intent, set on/left_on/right_on explicitly, and use validate (e.g. "m:1") so pandas raises on unexpected key cardinality. I check .shape and null counts before and after, and confirm the row count matches expectations to catch fan-out or dropped rows.' },
  { id: 'iv-py-3', q: 'Walk through how you would clean a messy sales CSV.',
    a: 'Load with explicit dtypes/parse_dates, inspect with info()/describe()/value_counts. Standardize text (strip/lower), coerce numerics with errors="coerce", handle missing values deliberately (drop/fill/flag), remove duplicates, validate ranges and categories, then document each decision since it affects the analysis.' },
]

export const capstone = {
  id: 'cap-py',
  title: 'Capstone: End-to-End Mini Analysis',
  blocks: [
    { p: 'Using the df in the exercises (or your own data), build a short analysis in the playground:' },
    { ul: [
      'Compute total and average sales per city and per month.',
      'Add a share-of-total column and a high/low tier column.',
      'Produce a city × month pivot table.',
      'Write one sentence stating the main insight you would tell a stakeholder.',
    ] },
  ],
}
