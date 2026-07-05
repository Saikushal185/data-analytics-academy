// SQL track — lessons, graded challenges (with private `expected`), quiz,
// interview questions, capstone, and the seed database used for grading.

export const seedSql = `
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name TEXT,
  region TEXT,
  signup_date TEXT
);
INSERT INTO customers VALUES
  (1,'Ava','West','2025-01-05'),
  (2,'Ben','East','2025-01-20'),
  (3,'Cara','West','2025-02-11'),
  (4,'Dan','South',NULL),
  (5,'Eve','East','2025-03-02'),
  (6,'Finn','West','2025-03-28');

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  name TEXT,
  category TEXT,
  price REAL
);
INSERT INTO products VALUES
  (10,'Widget','Hardware',25.0),
  (11,'Gadget','Hardware',40.0),
  (12,'Plan Pro','Software',99.0),
  (13,'Plan Lite','Software',29.0),
  (14,'Cable','Hardware',9.0);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  order_date TEXT,
  amount REAL
);
INSERT INTO orders VALUES
  (1001,1,10,'2025-03-01',25.0),
  (1002,1,12,'2025-03-15',99.0),
  (1003,2,11,'2025-03-18',40.0),
  (1004,1,13,'2025-04-02',29.0),
  (1005,3,12,'2025-04-10',99.0),
  (1006,2,10,'2025-04-22',25.0),
  (1007,3,11,'2025-05-05',40.0),
  (1008,1,11,'2025-05-09',40.0),
  (1009,5,12,'2025-05-20',99.0),
  (1010,3,13,'2025-06-01',29.0),
  (1011,5,14,'2025-06-08',9.0),
  (1012,2,12,'2025-06-12',99.0),
  (1013,1,10,'2025-06-20',25.0);

CREATE TABLE employees (
  emp_id INTEGER PRIMARY KEY,
  name TEXT,
  manager_id INTEGER
);
INSERT INTO employees VALUES
  (1,'Root',NULL),
  (2,'Mia',1),
  (3,'Leo',1),
  (4,'Zoe',2),
  (5,'Sam',2);
`

export const lessons = [
  {
    id: 'sql-joins',
    title: 'Joins, NULLs & Deduplication',
    blocks: [
      { p: 'Joins combine rows from two tables on a related column. The join type decides what happens to rows with no match.' },
      { ul: [
        'INNER JOIN — only rows matching in both tables.',
        'LEFT JOIN — all left rows; unmatched right columns become NULL.',
        'RIGHT / FULL OUTER — mirror of LEFT / both sides kept.',
        'CROSS JOIN — every combination (Cartesian product). Rarely intentional.',
      ] },
      { h: 'NULL is "unknown", not a value' },
      { p: 'Comparisons with = against NULL yield neither true nor false. Use IS NULL / IS NOT NULL, and COALESCE to substitute a default. NOT IN (subquery with a NULL) returns no rows — a classic trap; prefer NOT EXISTS.' },
      { code: "SELECT name, COALESCE(region, 'Unknown') AS region\nFROM customers\nWHERE region IS NULL;" },
      { h: 'Deduplication' },
      { p: 'DISTINCT dedupes whole rows. To keep one row per group (e.g. latest order per customer), use ROW_NUMBER() rather than GROUP BY + MAX hacks.' },
      { note: 'A LEFT JOIN into a one-to-many table silently multiplies rows and inflates SUM/COUNT. Always know the grain of each table before joining.' },
    ],
  },
  {
    id: 'sql-set-anti',
    title: 'Set Operations & Anti-Joins',
    blocks: [
      { p: 'UNION stacks two result sets and removes duplicates; UNION ALL keeps them (and is faster). INTERSECT/EXCEPT return common/different rows.' },
      { code: "SELECT customer_id FROM orders WHERE amount > 90\nUNION\nSELECT customer_id FROM customers WHERE region = 'East';" },
      { h: 'Anti-join: "rows in A with no match in B"' },
      { p: 'The cleanest pattern is NOT EXISTS (NULL-safe). A LEFT JOIN ... WHERE b.key IS NULL works too.' },
      { code: "SELECT c.*\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id\n);" },
      { note: 'Columns in UNION must match in count and compatible types, and the output names come from the first SELECT.' },
    ],
  },
  {
    id: 'sql-cte',
    title: 'CTEs, Subqueries & Recursion',
    blocks: [
      { p: 'A Common Table Expression (CTE) names a query you can reference like a table, making multi-step logic read top-to-bottom.' },
      { code: "WITH monthly AS (\n  SELECT customer_id,\n         strftime('%Y-%m', order_date) AS ym,\n         SUM(amount) AS spend\n  FROM orders\n  GROUP BY 1, 2\n)\nSELECT ym, ROUND(AVG(spend),2) AS avg_spend\nFROM monthly\nGROUP BY ym\nORDER BY ym;" },
      { ul: [
        'Correlated subqueries run per row — readable but often slow; a JOIN or window is usually faster.',
        'Scalar subqueries return one value and can sit in SELECT.',
        'Recursive CTEs (WITH RECURSIVE) walk hierarchies like org charts.',
      ] },
      { code: "WITH RECURSIVE chain AS (\n  SELECT emp_id, name, manager_id, 0 AS depth FROM employees WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.emp_id, e.name, e.manager_id, c.depth + 1\n  FROM employees e JOIN chain c ON e.manager_id = c.emp_id\n)\nSELECT * FROM chain ORDER BY depth;" },
    ],
  },
  {
    id: 'sql-window',
    title: 'Window Functions (the big one)',
    blocks: [
      { p: 'Window functions compute across rows related to the current row WITHOUT collapsing them like GROUP BY. This is the skill that separates intermediate from advanced analysts.' },
      { code: "SELECT customer_id, order_date, amount,\n  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS nth_order,\n  SUM(amount)  OVER (PARTITION BY customer_id ORDER BY order_date) AS running_total,\n  LAG(amount)  OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_amount\nFROM orders;" },
      { h: 'Anatomy of OVER()' },
      { ul: [
        'PARTITION BY — restart the calc per group (keeps rows, unlike GROUP BY).',
        'ORDER BY — order within the partition (needed for running totals, LAG/LEAD, ranks).',
        'Frame (ROWS/RANGE BETWEEN ...) — the moving window, e.g. a 3-row moving average.',
      ] },
      { h: 'Ranking family' },
      { ul: [
        'ROW_NUMBER — unique 1,2,3 even on ties.',
        'RANK — ties share a rank, leaves gaps (1,1,3).',
        'DENSE_RANK — ties share a rank, no gaps (1,1,2).',
        'NTILE(n) — splits rows into n buckets (quartiles, deciles).',
      ] },
      { h: 'Frames for moving windows' },
      { code: "AVG(amount) OVER (\n  PARTITION BY customer_id ORDER BY order_date\n  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n) AS moving_avg_3" },
      { note: 'Filtering on a window result needs a wrapper (CTE/subquery) — you cannot use it in WHERE. Some engines add QUALIFY for this.' },
    ],
  },
  {
    id: 'sql-dates',
    title: 'Dates, Cohorts & Time Series',
    blocks: [
      { p: 'Date logic powers most analytics: month-over-month growth, retention, cohorts.' },
      { ul: [
        "Bucket by month with strftime('%Y-%m', d) (SQLite) / DATE_TRUNC('month', d) (Postgres).",
        'Period-over-period: LAG the prior period value, then compute (cur - prev) / prev.',
        'A cohort groups users by their first-activity period, then tracks them over time.',
      ] },
      { code: "SELECT strftime('%Y-%m', order_date) AS ym,\n       SUM(amount) AS revenue,\n       SUM(amount) - LAG(SUM(amount)) OVER (ORDER BY strftime('%Y-%m', order_date)) AS mom_change\nFROM orders\nGROUP BY ym\nORDER BY ym;" },
    ],
  },
  {
    id: 'sql-perf',
    title: 'Performance, Indexes & EXPLAIN',
    blocks: [
      { p: 'You need not be a DBA, but understanding why a query is slow makes you far more effective.' },
      { ul: [
        'Indexes let the engine seek instead of scanning; index the columns you filter and join on.',
        'EXPLAIN / EXPLAIN ANALYZE shows the plan — look for full table scans vs index seeks.',
        'Avoid functions on indexed columns in WHERE (e.g. WHERE DATE(col)=... can disable the index); use a range instead.',
        'SELECT only needed columns; avoid SELECT * in production.',
        'Filter early; beware join fan-out and accidental Cartesian products.',
      ] },
      { note: 'Correctness first, then performance. A fast wrong answer is still wrong.' },
    ],
  },
  {
    id: 'sql-cheatsheet',
    title: 'Cheat Sheet',
    blocks: [
      { h: 'Order of evaluation' },
      { p: 'FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT. (That is why you cannot use a SELECT alias in WHERE, but can in ORDER BY.)' },
      { h: 'Aggregates' },
      { code: "COUNT(*)            -- all rows\nCOUNT(col)         -- non-null only\nCOUNT(DISTINCT x)  -- unique non-null\nSUM / AVG / MIN / MAX\nGROUP BY ... HAVING agg_condition" },
      { h: 'Windows' },
      { code: "ROW_NUMBER() | RANK() | DENSE_RANK() | NTILE(4)\nLAG(x, 1) | LEAD(x, 1)\nSUM(x) OVER (PARTITION BY g ORDER BY d ROWS BETWEEN ...)\nFIRST_VALUE(x) | LAST_VALUE(x)" },
      { h: 'NULL-safe patterns' },
      { code: "COALESCE(x, 0)          -- default\nNULLIF(a, b)            -- NULL when equal (avoid /0)\nx IS NOT DISTINCT FROM y -- NULL-safe equality (PG)\nNOT EXISTS (...)        -- safe anti-join" },
    ],
  },
]

export const quiz = [
  { id: 'q-sql-1', q: 'You LEFT JOIN orders to a one-to-many shipments table, then SUM(order_amount). What goes wrong?',
    options: ['Nothing — LEFT JOIN is always safe', 'order_amount is double-counted because the join fans out rows', 'NULLs make the SUM zero', 'The query errors on duplicate keys'],
    answer: 1, why: 'A one-to-many join multiplies the order rows, so each amount counts once per shipment. Aggregate before joining.' },
  { id: 'q-sql-2', q: 'Which gives 1, 1, 2 for tied values (ties share a rank, no gaps)?',
    options: ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'NTILE()'], answer: 2,
    why: 'DENSE_RANK shares ranks without gaps. RANK gives 1,1,3; ROW_NUMBER gives unique 1,2,3.' },
  { id: 'q-sql-3', q: 'Cleanest way to keep one row per customer (their latest order):',
    options: ['SELECT DISTINCT customer_id', 'GROUP BY customer_id with MAX on every column', 'ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) then filter = 1', 'A correlated subquery per column'],
    answer: 2, why: 'ROW_NUMBER partitioned by customer, ordered by date desc, keeps the whole latest row by filtering rn = 1.' },
  { id: 'q-sql-4', q: "Why might WHERE DATE(created_at) = '2026-01-01' be slow?",
    options: ['DATE() is invalid SQL', 'Wrapping the column in a function can prevent index use', 'It scans the index twice', 'Dates cannot be indexed'],
    answer: 1, why: "A function on an indexed column often disables the index. Use a range: >= '2026-01-01' AND < '2026-01-02'." },
  { id: 'q-sql-5', q: 'Why prefer NOT EXISTS over NOT IN for an anti-join?',
    options: ['NOT IN is invalid SQL', 'NOT IN returns no rows if the subquery contains any NULL', 'NOT EXISTS is always indexed', 'They are identical'],
    answer: 1, why: 'A NULL in the NOT IN list makes the predicate unknown for every row, returning nothing. NOT EXISTS is NULL-safe.' },
  { id: 'q-sql-6', q: 'WHERE filters before grouping; which clause filters AFTER aggregation?',
    options: ['WHERE', 'HAVING', 'QUALIFY', 'LIMIT'], answer: 1,
    why: 'HAVING applies conditions to aggregated groups; WHERE applies to individual rows before GROUP BY.' },
  { id: 'q-sql-7', q: 'UNION vs UNION ALL:',
    options: ['Identical', 'UNION removes duplicates (slower); UNION ALL keeps them (faster)', 'UNION ALL removes duplicates', 'UNION only works on one table'],
    answer: 1, why: 'UNION de-duplicates and so must sort/hash; UNION ALL just concatenates and is faster when dupes are fine or impossible.' },
]

export const interview = [
  { id: 'iv-sql-1', q: 'Explain the difference between WHERE and HAVING.',
    a: 'WHERE filters individual rows before grouping and cannot reference aggregate functions. HAVING filters groups after GROUP BY and is where aggregate conditions (e.g. COUNT(*) > 2) belong. Because of evaluation order, WHERE runs first, reducing the rows that get aggregated.' },
  { id: 'iv-sql-2', q: 'How would you find the second-highest salary per department?',
    a: 'Use DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) in a CTE, then filter rank = 2. DENSE_RANK handles ties so multiple people sharing the top salary do not skip rank 2. ROW_NUMBER would be wrong if you want the second distinct salary.' },
  { id: 'iv-sql-3', q: 'A query that worked got slow after data grew. How do you diagnose it?',
    a: 'Run EXPLAIN/EXPLAIN ANALYZE to see the plan; look for sequential scans on large tables, missing indexes on filter/join keys, functions wrapping indexed columns, and join fan-out. Check row estimates vs actuals (stale stats), add/adjust indexes, and select only needed columns.' },
  { id: 'iv-sql-4', q: 'What is the grain of a table and why does it matter?',
    a: 'The grain is what a single row represents (e.g. one order line). It matters because joins and aggregations are only correct when you know the grain — joining two tables at different grains causes fan-out and double counting. Define grain before writing aggregates.' },
]

export const capstone = {
  id: 'cap-sql',
  title: 'Capstone: Monthly Revenue & Retention Report',
  blocks: [
    { p: 'Using the sample database in the playground, write a single query (CTEs allowed) that produces, per month: total revenue, number of active customers, month-over-month revenue growth %, and the running cumulative revenue.' },
    { ul: [
      'Bucket orders by month.',
      'Use LAG for MoM growth and a windowed SUM for the cumulative total.',
      'Bonus: add a cohort view — first-order month per customer, then count returning customers per later month.',
    ] },
    { note: 'Mark this complete once you can produce the report and explain each window function you used.' },
  ],
}

export const challenges = [
  { id: 'sc-1', title: 'Basic filter', prompt: 'List the name and region of all customers in the "West" region.',
    starter: 'SELECT name, region\nFROM customers\nWHERE ...;',
    expected: "SELECT name, region FROM customers WHERE region = 'West' ORDER BY name;", ordered: false },
  { id: 'sc-2', title: 'Handle NULLs', prompt: 'Return every customer\'s name and signup_date, showing "unknown" when NULL. Alias the second column as signup.',
    starter: "SELECT name, COALESCE(...) AS signup\nFROM customers;",
    expected: "SELECT name, COALESCE(signup_date,'unknown') AS signup FROM customers ORDER BY name;", ordered: false },
  { id: 'sc-3', title: 'Join + aggregate', prompt: 'For each region, total order amount. Columns: region, total. Order by total descending.',
    starter: 'SELECT c.region, SUM(o.amount) AS total\nFROM orders o\nJOIN customers c ON ...\nGROUP BY ...\nORDER BY ...;',
    expected: 'SELECT c.region, SUM(o.amount) AS total FROM orders o JOIN customers c ON o.customer_id = c.customer_id GROUP BY c.region ORDER BY total DESC;', ordered: true },
  { id: 'sc-4', title: 'GROUP BY + HAVING', prompt: 'customer_ids with more than 2 orders. Columns: customer_id, n_orders. Order by customer_id.',
    starter: 'SELECT customer_id, COUNT(*) AS n_orders\nFROM orders\nGROUP BY customer_id\nHAVING ...;',
    expected: 'SELECT customer_id, COUNT(*) AS n_orders FROM orders GROUP BY customer_id HAVING COUNT(*) > 2 ORDER BY customer_id;', ordered: false },
  { id: 'sc-5', title: 'Category revenue', prompt: 'Total revenue per product category. Columns: category, revenue. Order by revenue desc.',
    starter: 'SELECT p.category, SUM(o.amount) AS revenue\nFROM orders o JOIN products p ON ...\nGROUP BY ...;',
    expected: 'SELECT p.category, SUM(o.amount) AS revenue FROM orders o JOIN products p ON o.product_id = p.product_id GROUP BY p.category ORDER BY revenue DESC;', ordered: true },
  { id: 'sc-6', title: 'Anti-join', prompt: 'Names of customers who have never placed an order. Order by name.',
    starter: 'SELECT name FROM customers c\nWHERE NOT EXISTS (...);',
    expected: 'SELECT name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id) ORDER BY name;', ordered: false },
  { id: 'sc-7', title: 'Window: ROW_NUMBER', prompt: 'Per order add nth = order number per customer (1 = earliest) by order_date. Return customer_id, order_date, nth ordered by customer_id, order_date.',
    starter: 'SELECT customer_id, order_date,\n  ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...) AS nth\nFROM orders\nORDER BY customer_id, order_date;',
    expected: 'SELECT customer_id, order_date, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS nth FROM orders ORDER BY customer_id, order_date;', ordered: true },
  { id: 'sc-8', title: 'Window: running total', prompt: 'For customer 1: order_date, amount, running_total of amount by order_date. Order by order_date.',
    starter: 'SELECT order_date, amount,\n  SUM(amount) OVER (ORDER BY ...) AS running_total\nFROM orders WHERE customer_id = 1\nORDER BY order_date;',
    expected: 'SELECT order_date, amount, SUM(amount) OVER (ORDER BY order_date) AS running_total FROM orders WHERE customer_id = 1 ORDER BY order_date;', ordered: true },
  { id: 'sc-9', title: 'Window: LAG', prompt: 'For customer 1: order_date, amount, prev_amount = previous order amount (NULL for first). Order by order_date.',
    starter: 'SELECT order_date, amount,\n  LAG(amount) OVER (ORDER BY ...) AS prev_amount\nFROM orders WHERE customer_id = 1\nORDER BY order_date;',
    expected: 'SELECT order_date, amount, LAG(amount) OVER (ORDER BY order_date) AS prev_amount FROM orders WHERE customer_id = 1 ORDER BY order_date;', ordered: true },
  { id: 'sc-10', title: 'Top-N per group', prompt: 'Each customer\'s single most expensive order: customer_id, amount. Use a window + filter. Order by customer_id.',
    starter: 'WITH ranked AS (\n  SELECT customer_id, amount,\n    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rn\n  FROM orders)\nSELECT customer_id, amount FROM ranked WHERE rn = 1\nORDER BY customer_id;',
    expected: 'WITH ranked AS (SELECT customer_id, amount, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rn FROM orders) SELECT customer_id, amount FROM ranked WHERE rn = 1 ORDER BY customer_id;', ordered: false },
  { id: 'sc-11', title: 'NTILE quartiles', prompt: 'Split all orders into 4 quartiles by amount. Return order_id, amount, quartile ordered by amount, order_id.',
    starter: 'SELECT order_id, amount,\n  NTILE(4) OVER (ORDER BY amount) AS quartile\nFROM orders\nORDER BY amount, order_id;',
    expected: 'SELECT order_id, amount, NTILE(4) OVER (ORDER BY amount) AS quartile FROM orders ORDER BY amount, order_id;', ordered: true },
  { id: 'sc-12', title: 'Monthly revenue', prompt: "Revenue per month. Columns: ym (YYYY-MM), revenue. Order by ym. Hint: strftime('%Y-%m', order_date).",
    starter: "SELECT strftime('%Y-%m', order_date) AS ym, SUM(amount) AS revenue\nFROM orders\nGROUP BY ym\nORDER BY ym;",
    expected: "SELECT strftime('%Y-%m', order_date) AS ym, SUM(amount) AS revenue FROM orders GROUP BY ym ORDER BY ym;", ordered: true },
  { id: 'sc-13', title: 'Month-over-month change', prompt: 'Per month: ym, revenue, and mom = revenue minus previous month revenue (NULL for first). Order by ym.',
    starter: "WITH m AS (\n  SELECT strftime('%Y-%m', order_date) AS ym, SUM(amount) AS revenue\n  FROM orders GROUP BY ym)\nSELECT ym, revenue,\n  revenue - LAG(revenue) OVER (ORDER BY ym) AS mom\nFROM m ORDER BY ym;",
    expected: "WITH m AS (SELECT strftime('%Y-%m', order_date) AS ym, SUM(amount) AS revenue FROM orders GROUP BY ym) SELECT ym, revenue, revenue - LAG(revenue) OVER (ORDER BY ym) AS mom FROM m ORDER BY ym;", ordered: true },
  { id: 'sc-14', title: 'Self-join hierarchy', prompt: 'List each employee with their manager name. Columns: name, manager. Use a self-join (NULL manager allowed). Order by name.',
    starter: 'SELECT e.name, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON ...\nORDER BY e.name;',
    expected: 'SELECT e.name AS name, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.emp_id ORDER BY e.name;', ordered: false },
  { id: 'sc-15', title: 'Share of total', prompt: 'Per region: region, total, pct = region total as a % of grand total rounded to 1 decimal. Order by total desc.',
    starter: 'SELECT c.region, SUM(o.amount) AS total,\n  ROUND(100.0*SUM(o.amount)/SUM(SUM(o.amount)) OVER (),1) AS pct\nFROM orders o JOIN customers c ON o.customer_id=c.customer_id\nGROUP BY c.region ORDER BY total DESC;',
    expected: 'SELECT c.region, SUM(o.amount) AS total, ROUND(100.0*SUM(o.amount)/SUM(SUM(o.amount)) OVER (),1) AS pct FROM orders o JOIN customers c ON o.customer_id=c.customer_id GROUP BY c.region ORDER BY total DESC;', ordered: true },
  { id: 'sc-16', title: 'Dedupe latest', prompt: "Each customer's most recent order date. Columns: customer_id, last_order. Order by customer_id.",
    starter: 'SELECT customer_id, MAX(order_date) AS last_order\nFROM orders GROUP BY customer_id ORDER BY customer_id;',
    expected: 'SELECT customer_id, MAX(order_date) AS last_order FROM orders GROUP BY customer_id ORDER BY customer_id;', ordered: false },
]
