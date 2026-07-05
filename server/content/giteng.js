// Git & Analytics Engineering track.
export const lessons = [
  {
    id: 'git-basics',
    title: 'Git Fundamentals',
    blocks: [
      { p: 'Git is version control: a history of snapshots (commits) you can branch, share, and revert. Essential as analytics work moves into code (SQL, dbt, Python).' },
      { code: "git clone <url>\ngit checkout -b feature/cohort-report\ngit add . && git commit -m \"Add cohort report model\"\ngit push -u origin feature/cohort-report\n# open a Pull Request for review" },
      { ul: [
        'A commit is a labeled snapshot; write clear messages.',
        'Branch for each change; keep main deployable.',
        'Pull Requests are where code is reviewed before merging.',
      ] },
    ],
  },
  {
    id: 'git-workflow',
    title: 'Branching, PRs & Resolving Conflicts',
    blocks: [
      { p: 'A simple, reliable team workflow: branch → commit → push → PR → review → merge.' },
      { ul: [
        'Keep branches small and short-lived to reduce merge pain.',
        'Pull/rebase main often so your branch stays current.',
        'A merge conflict happens when two branches change the same lines; Git marks them and you choose the right result, then commit.',
        'Never commit secrets or large data files; use .gitignore.',
      ] },
      { code: "git pull --rebase origin main   # update your branch\n# fix any <<<<<<< conflict markers, then:\ngit add . && git rebase --continue" },
    ],
  },
  {
    id: 'ae-modern-stack',
    title: 'The Modern Data Stack & ELT',
    blocks: [
      { p: 'Analytics engineering sits between data engineering and analysis: building trusted, documented, tested data models in the warehouse.' },
      { ul: [
        'Ingestion tools (Fivetran/Airbyte) load raw source data into the warehouse.',
        'Warehouse (Snowflake/BigQuery/Redshift) stores and computes.',
        'Transformation (dbt) turns raw → clean → marts in SQL — this is ELT (transform after load).',
        'BI tools (Power BI/Tableau/Looker) sit on top of the marts.',
      ] },
      { note: 'ETL transforms before loading (older); ELT loads raw then transforms in the warehouse (modern, cheaper compute).' },
    ],
  },
  {
    id: 'ae-dbt',
    title: 'dbt: Models, Tests & Sources',
    blocks: [
      { p: 'dbt lets analysts build transformations as version-controlled, tested SQL with dependency management.' },
      { ul: [
        'A model is a SELECT statement in a .sql file; dbt materializes it as a view/table.',
        'ref() builds a dependency graph (DAG) between models so they run in order.',
        'Tests (unique, not_null, relationships, accepted_values) catch data-quality issues automatically.',
        'Sources document and freshness-check raw tables; docs generate a searchable catalog + lineage.',
      ] },
      { code: "-- models/marts/customer_orders.sql\nselect\n  c.customer_id,\n  count(*) as orders,\n  sum(o.amount) as revenue\nfrom {{ ref('stg_customers') }} c\njoin {{ ref('stg_orders') }} o using (customer_id)\ngroup by 1" },
    ],
  },
  {
    id: 'ae-ci',
    title: 'Testing & CI for Analytics',
    blocks: [
      { p: 'Treat analytics code like software: review, test, and automate.' },
      { ul: [
        'Run dbt tests in CI on every PR so bad data/logic never merges.',
        'Use staging/prod environments; do not develop against production tables.',
        'Code review catches logic errors and shares knowledge.',
        'Document models and metrics so definitions stay consistent.',
      ] },
    ],
  },
  {
    id: 'git-cheatsheet',
    title: 'Cheat Sheet',
    blocks: [
      { h: 'Git' },
      { code: "git status | git diff\ngit checkout -b <branch>\ngit add -p | git commit -m \"...\"\ngit pull --rebase | git push\ngit log --oneline --graph" },
      { h: 'dbt' },
      { code: "dbt run        # build models\ndbt test       # run data tests\ndbt build      # run + test\ndbt docs generate && dbt docs serve" },
    ],
  },
]

export const quiz = [
  { id: 'q-git-1', q: 'Why create a branch for each change?',
    options: ['It is required to commit', 'To isolate work and keep main deployable, then merge via PR', 'It makes Git faster', 'To avoid writing commit messages'],
    answer: 1, why: 'Branches isolate changes for review and keep the main line stable.' },
  { id: 'q-git-2', q: 'A merge conflict occurs when:',
    options: ['You forget to commit', 'Two branches change the same lines differently', 'A file is too large', 'You push to main'],
    answer: 1, why: 'Git cannot auto-merge overlapping edits; you resolve and commit the intended result.' },
  { id: 'q-git-3', q: 'ELT differs from ETL in that it:',
    options: ['Never transforms data', 'Loads raw into the warehouse first, then transforms there', 'Only works in Excel', 'Transforms before loading'],
    answer: 1, why: 'ELT loads raw then transforms with warehouse compute — the modern default.' },
  { id: 'q-git-4', q: 'In dbt, ref() is used to:',
    options: ['Refresh a dashboard', 'Reference another model and build the dependency DAG', 'Define a chart', 'Connect to BI tools'],
    answer: 1, why: 'ref() links models so dbt knows build order and lineage.' },
  { id: 'q-git-5', q: 'A key benefit of running dbt tests in CI:',
    options: ['Prettier SQL', 'Bad data/logic is caught before it merges to production', 'Faster queries', 'Smaller warehouse'],
    answer: 1, why: 'Automated tests on every PR prevent broken models from reaching prod.' },
]

export const interview = [
  { id: 'iv-git-1', q: 'Walk me through your git workflow for a change.',
    a: 'I branch off an up-to-date main, make small focused commits with clear messages, and push to open a PR. I keep the branch rebased on main to minimize conflicts, request review, address feedback, ensure CI/tests pass, then squash-merge. I never commit secrets or large data and rely on .gitignore.' },
  { id: 'iv-git-2', q: 'What does an analytics engineer do that a data analyst typically does not?',
    a: 'They own the transformation layer: building modular, tested, documented data models (often in dbt) in the warehouse so analysts and dashboards consume trusted, consistent data. They apply software practices — version control, code review, testing, CI, and environments — to data, bridging data engineering and analytics.' },
  { id: 'iv-git-3', q: 'How do you ensure data quality in a dbt project?',
    a: 'Define schema tests (unique, not_null, relationships, accepted_values) on key columns, add freshness checks on sources, write custom/singular tests for business rules, and run dbt test in CI on every PR. Combined with code review, documentation, and separate dev/prod environments, this keeps models trustworthy.' },
]

export const capstone = {
  id: 'cap-git',
  title: 'Capstone: Design a Small dbt Project',
  blocks: [
    { p: 'Outline a dbt project for the orders dataset used in the SQL track.' },
    { ul: [
      'Define staging models (stg_customers, stg_orders) and one mart (customer_orders).',
      'List the tests you would add (e.g. unique customer_id, not_null amount, relationship orders→customers).',
      'Describe the git workflow and what your CI would run on each PR.',
      'Explain why this is ELT and where BI tools plug in.',
    ] },
  ],
}
