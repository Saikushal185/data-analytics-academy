// Excel / Power BI (DAX) track.
export const lessons = [
  {
    id: 'xl-formulas',
    title: 'Modern Excel Formulas',
    blocks: [
      { p: 'Lookup and dynamic-array functions replace fragile VLOOKUP/nested-IF patterns.' },
      { code: "=XLOOKUP(key, lookup_range, return_range, \"Not found\")\n=FILTER(data, (region=\"West\")*(sales>100))\n=SUMIFS(amount, region, \"West\", month, \"Jan\")\n=LET(r, sales*price, IF(r>1000, r*0.9, r))" },
      { ul: [
        'XLOOKUP — replaces VLOOKUP/HLOOKUP; can search left, return arrays, and handle not-found.',
        'FILTER/SORT/UNIQUE — spill dynamic arrays; multiply conditions for AND, add for OR.',
        'SUMIFS/COUNTIFS/AVERAGEIFS — multi-criteria aggregation.',
        'LET names intermediate results for speed and readability; LAMBDA builds reusable functions.',
      ] },
    ],
  },
  {
    id: 'xl-pivots',
    title: 'PivotTables & Power Query',
    blocks: [
      { p: 'PivotTables are the fastest way to summarize; Power Query is the repeatable cleaning/ETL layer.' },
      { ul: [
        'PivotTable: drag fields into Rows/Columns/Values; change aggregation; add % of total via "Show Values As".',
        'Slicers and timelines make pivots interactive.',
        'Power Query (Get & Transform): import, clean, unpivot, merge, and refresh — steps are recorded and reusable.',
        'Unpivot wide data into long format so it is pivot/BI-friendly.',
      ] },
      { note: 'If you find yourself manually re-cleaning the same file each week, move that work into Power Query.' },
    ],
  },
  {
    id: 'dax-context',
    title: 'DAX: Measures, Columns & Context',
    blocks: [
      { p: 'DAX powers Power BI. The key mental model is evaluation context.' },
      { ul: [
        'Calculated column — computed row-by-row, stored in the table (row context).',
        'Measure — computed at query time for the current filter context (use these for aggregations).',
        'Row context: "the current row". Filter context: "the slicers/visual filters currently applied".',
        'Prefer measures over calculated columns for totals — they respond to slicers and cost less memory.',
      ] },
      { code: "Total Sales = SUM(Sales[Amount])\nMargin % = DIVIDE([Profit], [Total Sales])" },
    ],
  },
  {
    id: 'dax-calculate',
    title: 'DAX: CALCULATE & Time Intelligence',
    blocks: [
      { p: 'CALCULATE is the most important DAX function — it evaluates an expression in a modified filter context.' },
      { code: "Sales West = CALCULATE([Total Sales], Regions[Name] = \"West\")\nSales YTD = TOTALYTD([Total Sales], 'Date'[Date])\nSales LY  = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))\nYoY %     = DIVIDE([Total Sales] - [Sales LY], [Sales LY])" },
      { ul: [
        'CALCULATE adds/overrides filters; FILTER lets you express complex conditions.',
        'Time intelligence (TOTALYTD, SAMEPERIODLASTYEAR, DATEADD) needs a proper marked Date table.',
        'ALL / REMOVEFILTERS strip filters — useful for "% of total" measures.',
      ] },
      { note: 'A dedicated, continuous Date table marked as a date table is required for time-intelligence functions to work correctly.' },
    ],
  },
  {
    id: 'xl-cheatsheet',
    title: 'Cheat Sheet',
    blocks: [
      { h: 'Excel' },
      { code: "XLOOKUP | FILTER | UNIQUE | SORT\nSUMIFS | COUNTIFS | AVERAGEIFS\nLET | LAMBDA | INDEX/MATCH (legacy)" },
      { h: 'DAX' },
      { code: "SUM/AVERAGE/COUNTROWS\nCALCULATE(expr, filters...)\nDIVIDE(a, b, alt)\nTOTALYTD | SAMEPERIODLASTYEAR | DATEADD\nALL | REMOVEFILTERS | ALLEXCEPT" },
    ],
  },
]

export const quiz = [
  { id: 'q-xl-1', q: 'Main advantage of XLOOKUP over VLOOKUP:',
    options: ['It is shorter to type only', 'It can look left, return arrays, and handle not-found natively', 'It is the same', 'It only works in Power BI'],
    answer: 1, why: 'XLOOKUP searches any direction, supports default-if-missing, and avoids brittle column-index numbers.' },
  { id: 'q-xl-2', q: 'In DAX, for a total that responds to slicers you should use a:',
    options: ['Calculated column', 'Measure', 'Pivot field', 'Named range'],
    answer: 1, why: 'Measures evaluate in the current filter context at query time; calculated columns are static per row.' },
  { id: 'q-xl-3', q: 'CALCULATE primarily lets you:',
    options: ['Sort a table', 'Evaluate an expression in a modified filter context', 'Create a relationship', 'Refresh data'],
    answer: 1, why: 'CALCULATE adds or overrides filters around an expression — the core of advanced DAX.' },
  { id: 'q-xl-4', q: 'Time-intelligence functions (TOTALYTD) require:',
    options: ['Nothing special', 'A proper marked Date table', 'Power Query', 'A pivot chart'],
    answer: 1, why: 'A continuous Date table marked as a date table provides the calendar DAX needs.' },
  { id: 'q-xl-5', q: 'Repeating the same weekly cleanup on a file is best moved into:',
    options: ['More VLOOKUPs', 'Power Query (recorded, refreshable steps)', 'A bigger pivot', 'Manual copy-paste'],
    answer: 1, why: 'Power Query records transform steps you can refresh, eliminating manual rework.' },
]

export const interview = [
  { id: 'iv-xl-1', q: 'Explain row context vs filter context in DAX.',
    a: 'Row context is "the current row" — it exists in calculated columns and iterators (SUMX), letting you reference column values per row. Filter context is the set of filters applied by slicers, rows/columns of a visual, and CALCULATE. Measures evaluate in filter context. CALCULATE is the bridge: it can turn filters on/off and also transition row context into filter context.' },
  { id: 'iv-xl-2', q: 'When would you use a measure vs a calculated column?',
    a: 'Use a measure for aggregations that should respond to the report\'s filters (totals, ratios, time intelligence) — they are computed at query time and memory-light. Use a calculated column when you need a static per-row value to slice/filter by or to use in relationships, knowing it is stored and recalculated only on refresh.' },
]

export const capstone = {
  id: 'cap-xl',
  title: 'Capstone: Sales Dashboard Measures',
  blocks: [
    { p: 'Design the measures for a Power BI sales dashboard (write the DAX, no tool needed).' },
    { ul: [
      'Total Sales, Total Profit, and Margin % (use DIVIDE).',
      'Sales YTD and Sales vs Last Year with a YoY % measure.',
      'A "% of Total Sales" measure using ALL/REMOVEFILTERS.',
      'Explain what Date table you need and why.',
    ] },
  ],
}
